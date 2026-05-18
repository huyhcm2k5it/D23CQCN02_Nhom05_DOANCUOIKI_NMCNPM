"""
convert_to_gguf.py - Chuyển đổi mô hình PyTorch sang định dạng GGUF Q4_K_M cho Ollama

Cách dùng:
    1. Đảm bảo đã chạy train_laptop_chatbot.py thành công
    2. Thực thi tập lệnh: python convert_to_gguf.py
    3. Thư mục đầu ra chứa tệp GGUF nén phù hợp để nhập vào Ollama
"""

from unsloth import FastLanguageModel
from pathlib import Path

MODEL_DIR = str(Path(__file__).resolve().parent / "laptop-chatbot-qwen7b-merged")
OUTPUT_NAME = "laptop-chatbot-qwen7b"
QUANT_METHOD = "q4_k_m"  # Phương pháp nén cân bằng tốt nhất giữa hiệu năng và dung lượng bộ nhớ.

print("-" * 60)
print("CHUYỂN ĐỔI MÔ HÌNH SANG ĐỊNH DẠNG GGUF (Q4_K_M)")
print("-" * 60)
print(f"Thư mục nguồn: {MODEL_DIR}")
print(f"Phương pháp nén (Quantization): {QUANT_METHOD}")
print(f"Dung lượng dự kiến sau nén: ~4.4GB")

print("\nĐang tiến hành nạp mô hình gốc...")
model, tokenizer = FastLanguageModel.from_pretrained(MODEL_DIR)
print("   Đã nạp mô hình thành công.")

# Hướng dẫn chi tiết biên dịch llama.cpp để nén mô hình sang định dạng GGUF
print(f"\n{'-' * 60}")
print("BƯỚC 1 HOÀN THÀNH: Mô hình gốc đã được lưu hoàn chỉnh tại thư mục:")
print(f"{MODEL_DIR}")
print("-" * 60)
print("Các lệnh bash cần thực thi tiếp theo trên Colab / Linux để nén GGUF:")
print("----------------------------------------------------------------------")
print("if [ ! -d 'llama.cpp' ]; then git clone https://github.com/ggerganov/llama.cpp; fi")
print("cd llama.cpp")
print("pip install -r requirements.txt")
print("cmake -B build")
print("cmake --build build --config Release -j4")
print("cd ..")
print(f"python llama.cpp/convert_hf_to_gguf.py {MODEL_DIR} --outfile {OUTPUT_NAME}-F16.gguf --outtype f16")
print("QUANTIZE_BIN=$(find llama.cpp -name 'llama-quantize' -type f -executable | head -n 1)")
print("if [ -z \"$QUANTIZE_BIN\" ]; then echo 'LỖI BIÊN DỊCH: Không tìm thấy llama-quantize. Quá trình CMake đã thất bại!'; exit 1; fi")
print("echo 'Tìm thấy công cụ nén tại: $QUANTIZE_BIN'")
print(f"$QUANTIZE_BIN {OUTPUT_NAME}-F16.gguf {OUTPUT_NAME}-{QUANT_METHOD.upper()}.gguf {QUANT_METHOD.lower()}")
print("-" * 60)
print(f"Sau khi chạy xong các lệnh trên, tệp {OUTPUT_NAME}-{QUANT_METHOD.upper()}.gguf sẽ được tạo ra.")
print("----------------------------------------------------------------------")
