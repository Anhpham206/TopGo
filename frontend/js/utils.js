//  COMPREHENSIVE VALIDATION (ported from Flask utils.py)
// ============================================================
function getTravelHours(depId, destId, transport) {
    if (!depId || !destId || depId === destId) return 0;
    const distance = getApproxDistance(depId, destId);
    if (!distance) return 0;
    const speed = AVG_SPEED[transport] || 50;
    return distance / speed;
}

function validateTransportRules(depId, destId, transport, days, pax, budget) {
    const result = [];
    const isIntercity = depId && destId && depId !== destId;
    const distance = isIntercity ? (getApproxDistance(depId, destId) || 0) : 0;

    if (transport === 'Xe đạp') {
        if (isIntercity) {
            result.push({ type: 'error', msg: 'Xe đạp chỉ phù hợp khi di chuyển trong cùng một thành phố/tỉnh. Vui lòng chọn phương tiện khác cho chuyến đi liên tỉnh.' });
        }
        return result;
    }

    if (isIntercity && distance > 0) {
        const travelHours = getTravelHours(depId, destId, transport);
        const maxHoursPerDay = 12;
        if (days === 1 && travelHours > maxHoursPerDay) {
            result.push({ type: 'error', msg: `⏱ Thời gian di chuyển một chiều ước tính ${travelHours.toFixed(1)} giờ, vượt quá ${maxHoursPerDay} giờ/ngày. Không thể thực hiện trong 1 ngày.` });
        } else if (travelHours > days * maxHoursPerDay) {
            result.push({ type: 'error', msg: `⏱ Tổng thời gian di chuyển ${travelHours.toFixed(1)} giờ cần ít nhất ${Math.floor(travelHours / maxHoursPerDay) + 1} ngày. Hiện tại chỉ có ${days} ngày.` });
        }

        if (transport === 'Xe máy') {
            if (distance > 800) {
                result.push({ type: 'error', msg: `Xe máy không phù hợp cho quãng đường ${distance} km. Hãy chọn xe khách, tàu hỏa hoặc máy bay.` });
            } else if (distance > 500) {
                result.push({ type: 'warning', msg: `⚠️ Quãng đường ${distance} km bằng xe máy rất vất vả và nguy hiểm. Cân nhắc phương tiện khác.` });
            }
        }

        if (transport === 'Xe khách' && distance > 800) {
            result.push({ type: 'warning', msg: `⚠️ Xe khách cho ${distance} km sẽ mất 15–20 tiếng. Hãy cân nhắc tàu hỏa hoặc máy bay.` });
        }

        if (transport === 'Ô tô riêng' || transport === 'Thuê ô tô tự lái') {
            if (distance >= 1500 && days < 3) {
                result.push({ type: 'error', msg: `❌ Quãng đường ${distance} km bằng ô tô cần ít nhất 3–4 ngày (hiện tại: ${days} ngày). Đề xuất chọn máy bay.` });
            } else if (distance > 700 && days <= 1) {
                result.push({ type: 'warning', msg: `⚠️ Lái xe ${distance} km mất 8–12 tiếng, không khả thi trong ${days} ngày. Cân nhắc máy bay hoặc tàu.` });
            }
        }

        if (transport === 'Tàu hỏa') {
            const cost = pax * distance * TRAIN_COST_PER_KM;
            if (budget < cost) {
                result.push({ type: 'error', msg: `💰 Ngân sách không đủ cho vé tàu hỏa (ước tính ${cost.toLocaleString('vi-VN')} ₫ cho ${pax} người). Cần tăng ngân sách hoặc chọn phương tiện rẻ hơn.` });
            }
        }

        if (transport === 'Xe khách') {
            const cost = pax * distance * BUS_COST_PER_KM;
            if (budget < cost) {
                result.push({ type: 'error', msg: `💰 Ngân sách không đủ cho vé xe khách (ước tính ${cost.toLocaleString('vi-VN')} ₫ cho ${pax} người). Cần tăng ngân sách hoặc chọn phương tiện rẻ hơn.` });
            }
        }
    }

    if (transport === 'Máy bay') {
        const minFlight = pax * TRANSPORT_MIN_PER_PAX['Máy bay'] * 2;
        if (budget < minFlight) {
            result.push({ type: 'error', msg: `💰 Ngân sách quá thấp cho vé máy bay khứ hồi. Cần tối thiểu ~${minFlight.toLocaleString('vi-VN')} ₫ cho ${pax} người. (Hiện tại: ${budget.toLocaleString('vi-VN')} ₫)` });
        }
    }

    if (transport === 'Thuê ô tô tự lái') {
        const rentalCost = 500_000 * days;
        if (budget < rentalCost) {
            result.push({ type: 'error', msg: `💰 Ngân sách không đủ cho thuê xe tự lái ${days} ngày (tối thiểu ${rentalCost.toLocaleString('vi-VN')} ₫). Hãy chọn phương tiện khác hoặc tăng ngân sách.` });
        }
    }

    return result;
}

function validateAccommodationRules(accommodation, budget, pax, days) {
    const errors = [];
    if (!accommodation || !budget || !pax || !days) return errors;
    const minPerNight = ACCOMMODATION_MIN_PER_NIGHT[accommodation] || 200_000;
    const roomsNeeded = Math.ceil(pax / 2);
    const totalMin = minPerNight * roomsNeeded * days;
    if (budget < totalMin) {
        errors.push({ type: 'error', msg: `💰 Ngân sách không đủ cho loại hình ${accommodation} với ${pax} người trong ${days} ngày. Cần tối thiểu ~${totalMin.toLocaleString('vi-VN')} ₫ cho chỗ ở (giả sử ${roomsNeeded} phòng).` });
    }
    return errors;
}

function simulatePricingCheck(budget, pax, days) {
    const warnings = [];
    
    // Cảnh báo mềm ngân sách thấp hơn khuyến nghị
    const minRecommendedPerPersonPerDay = 200_000;
    const recommendedBudget = pax * days * minRecommendedPerPersonPerDay;
    if (budget < recommendedBudget) {
        warnings.push({ type: 'warning', msg: `💰 Ngân sách thấp hơn mức khuyến nghị (tối thiểu ${recommendedBudget.toLocaleString('vi-VN')} ₫ cho ${pax} người trong ${days} ngày). Bạn vẫn có thể tiếp tục nhưng trải nghiệm có thể bị ảnh hưởng.` });
    }

    // Tra cứu giá thực tế
    const minPerPersonPerDay = 500_000;
    const required = pax * days * minPerPersonPerDay;
    if (budget < required) {
        warnings.push({ type: 'warning', msg: `💰 Sau khi tra cứu giá thực tế, hệ thống ước tính cần tối thiểu ${required.toLocaleString('vi-VN')} ₫ cho ${pax} người trong ${days} ngày. Ngân sách của bạn (${budget.toLocaleString('vi-VN')} ₫) không đáp ứng được. Vui lòng tăng ngân sách hoặc giảm số ngày/số người.` });
    }
    
    return warnings;
}

function isNonsensicalText(text) {
    if (!text || text.trim().length < 5) return true;
    const t = text.trim().toLowerCase();
    // All special characters
    if (/^[^a-zA-ZÀ-ỹ0-9\s]+$/.test(t)) return true;
    // Excessive character repetition (e.g., "aaaaaa")
    if (/(.)\1{4,}/.test(t)) return true;
    // Only digits
    if (/^\d+$/.test(t)) return true;
    
    // Check for basic travel keywords
    const travelKeywords = ['ăn', 'chơi', 'ngủ', 'biển', 'núi', 'cảnh', 'chụp', 'nghỉ', 'khách sạn', 'bay', 'xe', 'gia đình', 'trẻ', 'thích', 'đẹp', 'rẻ', 'đi', 'đến', 'tham quan', 'đặc sản', 'hải sản', 'tour', 'mua', 'sắm', 'chợ', 'trải nghiệm', 'kết hợp', 'sáng', 'trưa', 'chiều', 'tối'];
    const hasKeyword = travelKeywords.some(kw => t.includes(kw));
    
    if (!hasKeyword && t.length < 20) {
        return true;
    }
    return false;
}

function runComprehensiveValidation(payload) {
    const errors = [];
    let continueAllowed = true;
    let days = 1;

    const { city_id, dep_city_id, budget, pax, date_start, date_end, transport, accommodation, departure_time, return_time, notes } = payload;

    if (!city_id) {
        errors.push({ type: 'error', msg: '📍 Chưa chọn thành phố muốn đến.' });
        continueAllowed = false;
    }

    if (!budget || budget <= 0) {
        errors.push({ type: 'error', msg: '💰 Ngân sách phải là số dương lớn hơn 0.' });
        continueAllowed = false;
    } else if (budget < 100_000) {
        errors.push({ type: 'error', msg: '💰 Ngân sách tối thiểu 100.000 ₫.' });
        continueAllowed = false;
    }

    if (!pax || pax < 1 || pax > 50) {
        errors.push({ type: 'error', msg: '👥 Số lượng hành khách phải từ 1 đến 50.' });
        continueAllowed = false;
    }

    if (date_start && date_end) {
        const ds = new Date(date_start);
        const de = new Date(date_end);
        const today = new Date(); today.setHours(0, 0, 0, 0);

        if (isNaN(ds.getTime()) || isNaN(de.getTime())) {
            errors.push({ type: 'error', msg: '📅 Định dạng ngày không hợp lệ.' });
            continueAllowed = false;
        } else {
            if (ds < today) {
                errors.push({ type: 'error', msg: '📅 Ngày khởi hành không được ở quá khứ.' });
                continueAllowed = false;
            }
            const diff = Math.round((de - ds) / 864e5);
            days = Math.max(diff, 1);
            if (diff > 7) {
                errors.push({ type: 'error', msg: `📅 Khoảng thời gian vượt quá 7 ngày (hiện tại: ${diff} ngày).` });
                continueAllowed = false;
            }
            if (diff < 0) {
                errors.push({ type: 'error', msg: '📅 Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.' });
                continueAllowed = false;
            }
            if (diff === 0 && departure_time && return_time && return_time <= departure_time) {
                errors.push({ type: 'error', msg: '⏰ Trong cùng một ngày, giờ kết thúc phải sau giờ khởi hành.' });
                continueAllowed = false;
            }
        }
    } else {
        errors.push({ type: 'error', msg: '📅 Vui lòng chọn ngày khởi hành và ngày kết thúc.' });
        continueAllowed = false;
    }

    if (!dep_city_id) {
        errors.push({ type: 'warning', msg: '📍 Bạn chưa nhập điểm xuất phát. Hệ thống sẽ mặc định xuất phát từ thành phố đích (chuyến đi nội tỉnh).' });
    }

    // Notes validation
    if (notes !== undefined && notes !== null && notes.length > 0 && isNonsensicalText(notes)) {
        errors.push({ type: 'warning', msg: 'Nội dung ghi chú của bạn có vẻ không rõ ràng hoặc thiếu thông tin hữu ích. AI có thể không hiểu đúng ý bạn. Bạn vẫn có thể tiếp tục (hệ thống sẽ dùng lịch trình mặc định) hoặc quay lại chỉnh sửa để có trải nghiệm tốt hơn.' });
    }

    // Transport validation
    const transportIssues = validateTransportRules(dep_city_id, city_id, transport, days, pax, budget);
    for (const issue of transportIssues) {
        errors.push(issue);
        if (issue.type === 'error') continueAllowed = false;
    }

    // Accommodation validation
    const accomIssues = validateAccommodationRules(accommodation, budget, pax, days);
    for (const issue of accomIssues) {
        errors.push(issue);
        if (issue.type === 'error') continueAllowed = false;
    }

    // Pricing check (only if no hard errors so far)
    if (continueAllowed && city_id && budget > 0) {
        const pricingIssues = simulatePricingCheck(budget, pax, days);
        errors.push(...pricingIssues);
    }

    return { errors, continueAllowed };
}

