"""
routing_service.py - Logic xử lý thuật toán
- Tính tọa độ trung vị (median)
- Gọi OSRM Table API để lấy ma trận khoảng cách
- Thuật toán Nearest Neighbor gom nhóm địa điểm theo ngày
- Gọi OSRM Route API để tìm đường đi từng ngày
"""

import httpx
import statistics
import json
import os
from datetime import datetime
import math

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c





def calculate_median_coordinates(places: list) -> dict:
    """
    Tính tọa độ tối ưu bằng trung vị (median) của tất cả địa điểm.

    Args:
        places: Danh sách các địa điểm, mỗi địa điểm có lat và lon

    Returns:
        Dict chứa median_lat và median_lon
    """
    lats = [place["lat"] for place in places]
    lons = [place["lon"] for place in places]

    median_lat = statistics.median(lats)
    median_lon = statistics.median(lons)

    print(f"[MEDIAN] Tọa độ tối ưu: lat={median_lat}, lon={median_lon}")

    return {
        "lat": median_lat,
        "lon": median_lon
    }


async def get_distance_matrix(places: list, optimal_coord: dict) -> dict:
    """
    Gọi OSRM Table API để lấy ma trận khoảng cách.
    Bao gồm tất cả địa điểm + tọa độ tối ưu (index 0).

    Args:
        places: Danh sách các địa điểm
        optimal_coord: Tọa độ tối ưu (median)

    Returns:
        Dict chứa ma trận distances và durations
    """
    # Tọa độ tối ưu đặt ở vị trí đầu tiên (index 0)
    coords_list = [f"{optimal_coord['lon']},{optimal_coord['lat']}"]

    for place in places:
        coords_list.append(f"{place['lon']},{place['lat']}")

    coords_str = ";".join(coords_list)

    url = f"http://router.project-osrm.org/table/v1/driving/{coords_str}?annotations=distance,duration"

    print(
        f"[OSRM] Gửi yêu cầu ma trận khoảng cách: {len(places)} địa điểm + 1 tọa độ tối ưu")

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.get(url)
            data = response.json()
            if data.get("code") != "Ok":
                raise Exception(f"OSRM returned error code: {data.get('code')}")
            
            print(f"[OSRM] Nhận ma trận khoảng cách thành công: {len(data['distances'])}x{len(data['distances'][0])}")
            return {
                "distances": data["distances"],
                "durations": data["durations"]
            }
    except Exception as e:
        print(f"[OSRM] Lỗi lấy ma trận ({e}). Sử dụng Fallback tính toán (Haversine)...")
        # Fallback tính tay matrix
        all_places = [optimal_coord] + places
        n = len(all_places)
        distances = [[0] * n for _ in range(n)]
        durations = [[0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    dist_m = haversine_distance(all_places[i]["lat"], all_places[i]["lon"], all_places[j]["lat"], all_places[j]["lon"])
                    distances[i][j] = dist_m
                    # Giả định tốc độ 30km/h = ~8.33 m/s
                    durations[i][j] = dist_m / 8.33

        return {
            "distances": distances,
            "durations": durations
        }

def group_places_by_day(places: list, distance_matrix: dict, optimal_coord: dict, days: int, max_places_per_day: int) -> list:
    distances = distance_matrix["distances"]
    durations = distance_matrix.get("durations")

    n_places = len(places)
    visited = [False] * n_places
    day_groups = []

    START_TIME_OF_DAY = 8.0
    VISIT_DURATION = 3.0
    SPEED_KMH = 30.0

    print(f"[GROUPING] Bat dau gom nhom {n_places} dia diem vao {days} ngay, toi da {max_places_per_day} dia diem/ngay")

    for day in range(days):
        if all(visited):
            break

        current_day = []
        current_index = 0  # Bắt đầu mỗi ngày từ tọa độ trung vị (Hub)
        current_time = START_TIME_OF_DAY

        for step in range(max_places_per_day):
            # Cài đặt biến so sánh: Điểm đầu tiên tìm MAX (xa nhất), các điểm sau tìm MIN (gần nhất)
            if step == 0:
                best_score = -1.0
            else:
                best_score = float('inf')
                
            best_index = -1
            best_start_visit_time = 0

            for j in range(n_places):
                if not visited[j]:
                    matrix_index = j + 1
                    dist_meters = distances[current_index][matrix_index]

                    # Ước lượng thời gian di chuyển
                    if durations:
                        travel_time_hours = durations[current_index][matrix_index] / 3600
                    else:
                        travel_time_hours = (dist_meters / 1000) / SPEED_KMH

                    arrival_time = current_time + travel_time_hours
                    place = places[j]

                    open_time = float(place.get('open', 0.0) if place.get('open') is not None else 0.0)
                    close_time = float(place.get('close', 24.0) if place.get('close') is not None else 24.0)

                    # Bỏ qua nếu đến nơi trễ hơn giờ đóng cửa
                    if arrival_time > close_time:
                        continue

                    start_visit_time = max(arrival_time, open_time)
                    wait_time = start_visit_time - arrival_time

                    if step == 0:
                        # 1. FAR-FIRST SEED: Điểm đầu tiên của ngày PHẢI LÀ ĐIỂM XA HUB NHẤT.
                        score = dist_meters
                        if score > best_score:
                            best_score = score
                            best_index = j
                            best_start_visit_time = start_visit_time
                    else:
                        # 2. SAVINGS HEURISTIC: Các điểm tiếp theo ưu tiên gần điểm hiện tại, 
                        dist_back_to_hub = distances[matrix_index][0]
                        
                        # Điểm số = Đường đi tiếp + Phạt thời gian chờ + (Đường về Hub * Trọng số)
                        score = dist_meters + (wait_time * 4000) + (dist_back_to_hub * 0.2)

                        if score < best_score:
                            best_score = score
                            best_index = j
                            best_start_visit_time = start_visit_time

            # Nếu không tìm được điểm nào thỏa mãn thời gian đóng/mở cửa thì kết thúc ngày
            if best_index == -1:
                break

            visited[best_index] = True
            
            # Giữ nguyên cấu trúc trả về
            place_copy = places[best_index].copy()
            place_copy["order"] = len(current_day) + 1
            current_day.append(place_copy)

            # Cập nhật thông tin cho điểm tiếp theo
            current_index = best_index + 1
            current_time = best_start_visit_time + VISIT_DURATION

        if current_day:
            day_groups.append(current_day)
            safe_names = [str(p.get('name', 'N/A')).encode('ascii', 'replace').decode('ascii') for p in current_day]
            print(f"[GROUPING] Ngay {len(day_groups)}: {safe_names}")
        else:
            print("[GROUPING] Khong the tim them dia diem phu hop thoi gian")
            break

    return day_groups

    
async def get_daily_routes(day_groups: list, optimal_coord: dict) -> list:
    """
    Gọi OSRM Route API để tìm đường đi cho từng ngày.
    Mỗi ngày: tọa độ tối ưu → điểm 1 → điểm 2 → điểm 3

    Args:
        day_groups: Danh sách nhóm ngày từ thuật toán gom nhóm
        optimal_coord: Tọa độ tối ưu

    Returns:
        List chứa thông tin route cho mỗi ngày
    """
    daily_routes = []

    async with httpx.AsyncClient(timeout=30.0) as client:
            for day_idx, day_places in enumerate(day_groups):
                # Xây dựng tọa độ chu trình: optimal → place1 → place2 → ... → optimal
                coords_list = [f"{optimal_coord['lon']},{optimal_coord['lat']}"]

                for place in day_places:
                    coords_list.append(f"{place['lon']},{place['lat']}")
                    
                coords_list.append(f"{optimal_coord['lon']},{optimal_coord['lat']}")

                coords_str = ";".join(coords_list)

                url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson&steps=true"

                print(
                    f"[OSRM] Gửi yêu cầu route ngày {day_idx + 1}: {len(day_places)} địa điểm (chu trình khép kín)")

                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(url)
                        data = response.json()
                        
                        if data.get("code") != "Ok":
                            raise Exception(f"OSRM Error: {data.get('message')}")
                        
                        route = data["routes"][0]
                        legs = route["legs"]

                        # Tính thông tin khoảng cách từng chặng
                        leg_details = []
                        for leg_idx, leg in enumerate(legs):
                            if leg_idx == 0:
                                from_name = "Điểm tối ưu"
                                to_name = day_places[0].get("name", "N/A")
                            elif leg_idx == len(legs) - 1:
                                from_name = day_places[-1].get("name", "N/A")
                                to_name = "Điểm tối ưu"
                            else:
                                from_name = day_places[leg_idx - 1].get("name", "N/A")
                                to_name = day_places[leg_idx].get("name", "N/A")

                            leg_details.append({
                                "from": from_name,
                                "to": to_name,
                                "distance_m": round(leg["distance"], 2),
                                "distance_km": round(leg["distance"] / 1000, 2),
                                "duration_s": round(leg["duration"], 2),
                                "duration_min": round(leg["duration"] / 60, 2)
                            })

                        daily_routes.append({
                            "day": day_idx + 1,
                            "places": day_places,
                            "route_geometry": route["geometry"],
                            "total_distance_m": round(route["distance"], 2),
                            "total_distance_km": round(route["distance"] / 1000, 2),
                            "total_duration_s": round(route["duration"], 2),
                            "total_duration_min": round(route["duration"] / 60, 2),
                            "legs": leg_details
                        })

                        print(
                            f"[OSRM] Route ngày {day_idx + 1}: {route['distance']/1000:.2f} km, {route['duration']/60:.1f} phút")
                except Exception as e:
                    print(f"[OSRM] Lỗi route ngày {day_idx + 1} ({e}). Sử dụng Fallback (LineString)...")
                    # Fallback tạo LineString cơ bản nối thẳng các điểm
                    route_coords = [[optimal_coord['lon'], optimal_coord['lat']]]
                    total_dist = 0
                    
                    leg_details = []
                    prev_lat, prev_lon = optimal_coord['lat'], optimal_coord['lon']
                    
                    for leg_idx, place in enumerate(day_places):
                        route_coords.append([place['lon'], place['lat']])
                        dist = haversine_distance(prev_lat, prev_lon, place['lat'], place['lon'])
                        total_dist += dist
                        leg_details.append({
                            "from": "Điểm tối ưu" if leg_idx == 0 else day_places[leg_idx - 1].get("name", "N/A"),
                            "to": place.get("name", "N/A"),
                            "distance_m": round(dist, 2),
                            "distance_km": round(dist / 1000, 2),
                            "duration_s": round(dist / 8.33, 2),
                            "duration_min": round((dist / 8.33) / 60, 2)
                        })
                        prev_lat, prev_lon = place['lat'], place['lon']
                        
                    # Vòng về điểm xuất phát
                    route_coords.append([optimal_coord['lon'], optimal_coord['lat']])
                    dist = haversine_distance(prev_lat, prev_lon, optimal_coord['lat'], optimal_coord['lon'])
                    total_dist += dist
                    leg_details.append({
                        "from": day_places[-1].get("name", "N/A"),
                        "to": "Điểm tối ưu",
                        "distance_m": round(dist, 2),
                        "distance_km": round(dist / 1000, 2),
                        "duration_s": round(dist / 8.33, 2),
                        "duration_min": round((dist / 8.33) / 60, 2)
                    })
                    
                    total_duration = total_dist / 8.33

                    daily_routes.append({
                        "day": day_idx + 1,
                        "places": day_places,
                        "route_geometry": {
                            "type": "LineString",
                            "coordinates": route_coords
                        },
                        "total_distance_m": round(total_dist, 2),
                        "total_distance_km": round(total_dist / 1000, 2),
                        "total_duration_s": round(total_duration, 2),
                        "total_duration_min": round(total_duration / 60, 2),
                        "legs": leg_details
                    })

                    print(
                        f"[OSRM] Route ngày {day_idx + 1}: {route['distance']/1000:.2f} km, {route['duration']/60:.1f} phút")

    return daily_routes


async def generate_itinerary(places: list, days: int, max_places_per_day: int) -> dict:
    """
    Hàm cấu trúc lộ trình tổng quát gọi tuần tự các bước xử lý thuật toán
    Nhận dữ liệu đầu vào và trả ra cấu trúc JSON hoàn chỉnh cho controller
    """
    try:
        if not places:
            return {"status": "error", "message": "Danh sách địa điểm trống"}

        # 1. Tính toán tọa độ tối ưu
        optimal_coord = calculate_median_coordinates(places)

        # 2. Xây dựng ma trận khoảng cách từ OSRM
        distance_matrix = await get_distance_matrix(places, optimal_coord)

        # 3. Phân nhóm địa điểm vào các ngày
        day_groups = group_places_by_day(places, distance_matrix, optimal_coord, days, max_places_per_day)

        # 4. Tìm lộ trình chi tiết theo từng ngày (OSRM Route)
        daily_routes = await get_daily_routes(day_groups, optimal_coord)

        return {
            "status": "success",
            "optimal_coordinate": optimal_coord,
            "total_days": len(day_groups),
            "total_places": sum(len(group) for group in day_groups),
            "daily_routes": daily_routes
        }

    except Exception as e:
        print(f"[ERROR] Có lỗi khi tạo hành trình: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
