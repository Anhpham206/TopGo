import sys
import os
import json
import asyncio
import io

# Force utf-8 encoding for stdout to handle Vietnamese logging properly on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routing_service import generate_itinerary

async def main():
    try:
        # Đường dẫn file input/output
        base_dir = os.path.dirname(os.path.abspath(__file__))
        input_file = os.path.join(base_dir, "input.json")
        output_file = os.path.join(base_dir, "output.json")
        
        print(f"[TEST] Reading data from {input_file}")
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        places = data.get("places", [])
        
        # Test input data parameters
        days = 2
        max_places_per_day = 3
        
        print(f"[TEST] Starting generate_itinerary ({len(places)} places, {days} days)")
        
        result = await generate_itinerary(places, days, max_places_per_day)
        
        print(f"[TEST] Saving result to {output_file}")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        print("[TEST] Done! Check output.txt.")
    except Exception as e:
        print(f"[TEST] An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
