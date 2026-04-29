/* 
  ========================================================================
  FILE: utils.js
  CHỨC NĂNG: 
  - Chứa các hàm nghiệp vụ tiện ích (Pure Functions - không phụ thuộc trực tiếp DOM hoặc State thay đổi nội tại).
  - Trái tim của Engine Validation: kiểm tra quy tắc di chuyển (\`validateTransportRules\`), phòng nghỉ (\`validateAccommodationRules\`), đánh giá giá tiền logic so với ngày và người (\`simulatePricingCheck\`).
  - Thực thi bộ quy tắc (\`runComprehensiveValidation\`) để đảm bảo Payload trước khi gửi đi API hợp lệ hoàn toàn.
  - Xử lý làm sạch chuỗi văn bản (sanitizeText) và bộ lọc phát hiện nội dung vô nghĩa/spam (isNonsensicalText).
  ========================================================================
*/
import { getApproxDistance, TRANSPORT_MIN_PER_PAX, TRAIN_COST_PER_KM, BUS_COST_PER_KM, AVG_SPEED, ACCOMMODATION_MIN_PER_NIGHT } from './data.js';

export function getTravelHours(depId, destId, transport) {
    if (!depId || !destId || depId === destId) return 0;
    const distance = getApproxDistance(depId, destId);
    if (!distance) return 0;
    return distance / (AVG_SPEED[transport] || 50);
}

export function validateTransportRules(depId, destId, transport, days, pax, budget) {
    const result = [];
    const isIntercity = depId && destId && depId !== destId;
    const distance = isIntercity ? (getApproxDistance(depId, destId) || 0) : 0;
    if (transport === 'Xe đạp') {
        if (isIntercity) result.push({type:'error',msg:'Xe đạp chỉ phù hợp khi di chuyển trong cùng một thành phố/tỉnh. Vui lòng chọn phương tiện khác cho chuyến đi liên tỉnh.'});
        return result;
    }
    if (isIntercity && distance > 0) {
        // Removed travel time warnings based on user input. Travel time is now separate.
        if (transport === 'Tàu hỏa') {
            const cost = pax * distance * TRAIN_COST_PER_KM;
            if (budget < cost) result.push({type:'error',msg:`💰 Ngân sách không đủ cho vé tàu hỏa (ước tính ${cost.toLocaleString('vi-VN')} ₫ cho ${pax} người).`});
        }
        if (transport === 'Xe khách') {
            const cost = pax * distance * BUS_COST_PER_KM;
            if (budget < cost) result.push({type:'error',msg:`💰 Ngân sách không đủ cho vé xe khách (ước tính ${cost.toLocaleString('vi-VN')} ₫ cho ${pax} người).`});
        }
    }
    if (transport === 'Máy bay') {
        const minFlight = pax * TRANSPORT_MIN_PER_PAX['Máy bay'] * 2;
        if (budget < minFlight) result.push({type:'error',msg:`💰 Ngân sách quá thấp cho vé máy bay khứ hồi. Cần tối thiểu ~${minFlight.toLocaleString('vi-VN')} ₫.`});
    }
    if (transport === 'Thuê ô tô tự lái') {
        const rentalCost = 500_000 * days;
        if (budget < rentalCost) result.push({type:'error',msg:`💰 Ngân sách không đủ cho thuê xe tự lái ${days} ngày (tối thiểu ${rentalCost.toLocaleString('vi-VN')} ₫).`});
    }
    return result;
}

export function validateAccommodationRules(accommodation, budget, pax, days) {
    const errors = [];
    if (!accommodation || !budget || !pax || !days) return errors;
    const minPerNight = ACCOMMODATION_MIN_PER_NIGHT[accommodation] || 200_000;
    const roomsNeeded = Math.ceil(pax / 2);
    const totalMin = minPerNight * roomsNeeded * days;
    if (budget < totalMin)
        errors.push({type:'error',msg:`💰 Ngân sách không đủ cho ${accommodation} với ${pax} người trong ${days} ngày. Cần tối thiểu ~${totalMin.toLocaleString('vi-VN')} ₫.`});
    return errors;
}

export function simulatePricingCheck(budget, pax, days) {
    const warnings = [];
    const recBudget = pax * days * 200_000;
    if (budget < recBudget)
        warnings.push({type:'warning',msg:`💰 Ngân sách thấp hơn mức khuyến nghị (tối thiểu ${recBudget.toLocaleString('vi-VN')} ₫).`});
    const required = pax * days * 500_000;
    if (budget < required)
        warnings.push({type:'warning',msg:`💰 Hệ thống ước tính cần tối thiểu ${required.toLocaleString('vi-VN')} ₫ cho ${pax} người trong ${days} ngày.`});
    return warnings;
}

export function isNonsensicalText(text) {
    if (!text || text.trim().length < 5) return true;
    const t = text.trim().toLowerCase();
    if (/^[^a-zA-ZÀ-ỹ0-9\s]+$/.test(t)) return true;
    if (/(.)\\1{4,}/.test(t)) return true;
    if (/^\d+$/.test(t)) return true;
    const keywords = ['ăn','chơi','ngủ','biển','núi','cảnh','chụp','nghỉ','khách sạn','bay','xe','gia đình','trẻ','thích','đẹp','rẻ','đi','đến','tham quan','đặc sản','hải sản','tour','mua','sắm','chợ','trải nghiệm','kết hợp','sáng','trưa','chiều','tối'];
    if (!keywords.some(kw => t.includes(kw)) && t.length < 20) return true;
    return false;
}

export function runComprehensiveValidation(payload) {
    const errors = []; let continueAllowed = true; let days = 1;
    const {city_id,dep_city_id,budget,pax,date_start,date_end,transport,accommodation,departure_time,return_time,notes} = payload;
    if (!city_id) { errors.push({type:'error',msg:'📍 Chưa chọn thành phố muốn đến.'}); continueAllowed=false; }
    if (!budget||budget<=0) { errors.push({type:'error',msg:'💰 Ngân sách phải là số dương lớn hơn 0.'}); continueAllowed=false; }
    else if (budget<100_000) { errors.push({type:'error',msg:'💰 Ngân sách tối thiểu 100.000 ₫.'}); continueAllowed=false; }
    if (!pax||pax<1||pax>50) { errors.push({type:'error',msg:'👥 Số lượng hành khách phải từ 1 đến 50.'}); continueAllowed=false; }
    if (date_start && date_end) {
        const ds=new Date(date_start),de=new Date(date_end),today=new Date();
        today.setHours(0,0,0,0);
        if (isNaN(ds.getTime())||isNaN(de.getTime())) { errors.push({type:'error',msg:'📅 Định dạng ngày không hợp lệ.'}); continueAllowed=false; }
        else {
            if (ds<today) { errors.push({type:'error',msg:'📅 Ngày bắt đầu tham quan không được ở quá khứ.'}); continueAllowed=false; }
            const diff=Math.round((de-ds)/864e5); days=Math.max(diff,1);
            if (diff>7) { errors.push({type:'error',msg:`📅 Khoảng thời gian vượt quá 7 ngày (hiện tại: ${diff} ngày).`}); continueAllowed=false; }
            if (diff<0) { errors.push({type:'error',msg:'📅 Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'}); continueAllowed=false; }
            if (diff===0&&departure_time&&return_time&&return_time<=departure_time) { errors.push({type:'error',msg:'⏰ Trong cùng một ngày, giờ kết thúc tham quan phải sau giờ bắt đầu.'}); continueAllowed=false; }
        }
    } else { errors.push({type:'error',msg:'📅 Vui lòng chọn ngày bắt đầu và ngày kết thúc tham quan.'}); continueAllowed=false; }
    if (!dep_city_id) errors.push({type:'warning',msg:'📍 Bạn chưa nhập điểm xuất phát. Hệ thống sẽ mặc định xuất phát từ thành phố đích.'});
    if (notes&&notes.length>0&&isNonsensicalText(notes)) errors.push({type:'warning',msg:'Nội dung ghi chú có vẻ không rõ ràng. AI có thể không hiểu đúng ý bạn.'});
    
    const standardTransports = ['Xe khách', 'Máy bay', 'Tàu hỏa', 'Ô tô riêng', 'Xe máy', 'Thuê ô tô tự lái', 'Xe đạp'];
    if (transport && !standardTransports.includes(transport) && isNonsensicalText(transport)) {
        errors.push({type:'warning',msg:'Phương tiện bạn nhập tay có vẻ không hợp lệ hoặc quá ngắn (dưới 5 ký tự). AI có thể không hiểu đúng.'});
    }

    const standardAccom = ['Khách sạn', 'Homestay', 'Airbnb', 'Resort', 'Villa', 'Căn hộ'];
    if (accommodation && !standardAccom.includes(accommodation) && isNonsensicalText(accommodation)) {
        errors.push({type:'warning',msg:'Loại chỗ ở bạn nhập tay có vẻ không hợp lệ hoặc quá ngắn (dưới 5 ký tự). AI có thể không hiểu đúng.'});
    }
    const transportIssues = validateTransportRules(dep_city_id,city_id,transport,days,pax,budget);
    for (const issue of transportIssues) { errors.push(issue); if(issue.type==='error') continueAllowed=false; }
    const accomIssues = validateAccommodationRules(accommodation,budget,pax,days);
    for (const issue of accomIssues) { errors.push(issue); if(issue.type==='error') continueAllowed=false; }
    if (continueAllowed&&city_id&&budget>0) errors.push(...simulatePricingCheck(budget,pax,days));
    return {errors,continueAllowed};
}

export function sanitizeText(text) {
    let s = text.replace(/<[^>]*>/g,'').trim();
    if (s.length>500) s=s.substring(0,500);
    return s;
}
