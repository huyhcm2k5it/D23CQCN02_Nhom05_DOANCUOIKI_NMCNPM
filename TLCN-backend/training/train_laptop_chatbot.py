"""
train_laptop_chatbot.py - Fine-tune Qwen2.5-7B với Unsloth (QLoRA 4-bit)

Tối ưu cho Google Colab / GPU T4 (15GB VRAM) hoặc GPU RTX hỗ trợ Cuda:
- Model: unsloth/Qwen2.5-7B-Instruct-bnb-4bit
- max_seq_length=1024, batch_size=1, gradient_accumulation=8
- LoRA rank=16, 1 epoch
- Lưu ở định dạng merged 16-bit trước khi chuyển đổi sang GGUF

Cách dùng:
    1. Cài đặt các thư viện: pip install -r requirements.txt
    2. Đảm bảo tệp dataset.jsonl đã tồn tại trong thư mục
    3. Thực thi tập lệnh: python train_laptop_chatbot.py
    4. Thư mục đầu ra: laptop-chatbot-qwen7b-merged/
"""

import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
from pathlib import Path

# --- CẤU HÌNH CHO TIẾN TRÌNH HUẤN LUYỆN ---
# Sử dụng Qwen2.5-7B Instruct nạp sẵn 4-bit để xử lý Tiếng Việt tối ưu và tuân thủ RAG.
MODEL_NAME = "unsloth/Qwen2.5-7B-Instruct-bnb-4bit"
MAX_SEQ_LENGTH = 1024       # Chiều dài chuỗi tối đa phù hợp với khối dữ liệu RAG.
LORA_R = 16                 # Rank của LoRA nhằm điều chỉnh phong cách ngôn ngữ của chatbot.
LORA_ALPHA = 16
BATCH_SIZE = 1              # Batch size tối thiểu cho mỗi thiết bị để tiết kiệm bộ nhớ GPU.
GRAD_ACCUM = 8              # Tích lũy gradient mô phỏng quá trình huấn luyện batch lớn.
LEARNING_RATE = 5e-5
EPOCHS = 1                  # Số lượng kỷ nguyên huấn luyện nhằm tránh hiện tượng quá khớp (overfitting).
OUTPUT_DIR = str(Path(__file__).resolve().parent / "laptop-chatbot-qwen7b")
DATASET_FILE = str(Path(__file__).resolve().parent / "dataset.jsonl")

print("-" * 60)
print("TIẾN TRÌNH HUẤN LUYỆN QWEN 2.5 7B CHO LAPTOP SHOP CHATBOT")
print("-" * 60)
print(f"Mô hình nền: {MODEL_NAME}")
print(f"VRAM của GPU: {torch.cuda.get_device_properties(0).total_memory/1e9:.1f}GB")
print(f"Tham số: max_seq_length={MAX_SEQ_LENGTH}, batch={BATCH_SIZE}, grad_accum={GRAD_ACCUM}")
print(f"Tệp dữ liệu: {DATASET_FILE}")
print(f"Thư mục lưu trữ: {OUTPUT_DIR}")

# --- 1. TẢI MÔ HÌNH NỀN (4-bit quantization) ---
print("\nĐang tiến hành tải mô hình nền (quá trình tải lần đầu tiên có thể mất vài phút)...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=None,              # Tự động phát hiện kiểu dữ liệu float16/bfloat16.
    load_in_4bit=True,       # Nạp ở định dạng 4-bit để tiết kiệm tối đa tài nguyên bộ nhớ.
)

print(f"   Đã tải mô hình thành công. VRAM đang sử dụng: {torch.cuda.memory_allocated()/1e9:.2f}GB")

# --- 2. CẤU HÌNH THAM SỐ LORA ---
print("\nĐang thiết lập cấu hình tham số LoRA...")
model = FastLanguageModel.get_peft_model(
    model,
    r=LORA_R,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=LORA_ALPHA,
    lora_dropout=0.1,
    bias="none",
    use_gradient_checkpointing="unsloth",  # Kích hoạt lưu vết gradient của Unsloth để tiết kiệm RAM.
)
print(f"   Đã cấu hình LoRA thành công. VRAM đang sử dụng: {torch.cuda.memory_allocated()/1e9:.2f}GB")

# --- 3. NẠP VÀ CHUẨN HÓA DỮ LIỆU HUẤN LUYỆN ---
print(f"\nĐang tiến hành nạp tập dữ liệu huấn luyện từ: {DATASET_FILE}...")
import json
import datasets
from datasets import Dataset

# Khắc phục lỗi tương thích dill/pickle phát sinh trên một số phiên bản Python mới
datasets.arrow_dataset.generate_fingerprint = lambda *args, **kwargs: "dummy_fingerprint_123"

with open(DATASET_FILE, "r", encoding="utf-8") as f:
    raw_data = [json.loads(line) for line in f]

# Định dạng trực tiếp trên danh sách Python để tối ưu hóa hiệu năng thay thế cho hàm map()
print("Đang chuẩn hóa dữ liệu theo cấu trúc chat template của Qwen2.5...")
formatted_data = []
for item in raw_data:
    text = tokenizer.apply_chat_template(item["messages"], tokenize=False, add_generation_prompt=False)
    formatted_data.append({"text": text})

dataset = Dataset.from_list(formatted_data)
print(f"   Đã chuẩn hóa thành công {len(dataset)} mẫu hội thoại.")
print("   Chuẩn hóa dữ liệu với Qwen2.5 chat template thành công.")

# --- 4. THỰC THI TIẾN TRÌNH HUẤN LUYỆN ---
print(f"\nBắt đầu thực hiện quá trình huấn luyện ({EPOCHS} epoch)...")
print("   Khuyến nghị: Không sử dụng các ứng dụng nặng khác trong lúc đang huấn luyện.")
print("   Lưu ý: Quạt tản nhiệt của máy sẽ hoạt động công suất lớn - điều này hoàn toàn bình thường.\n")

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    args=TrainingArguments(
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        warmup_steps=10,
        num_train_epochs=EPOCHS,
        learning_rate=LEARNING_RATE,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        save_steps=200,
        output_dir=OUTPUT_DIR,
        optim="adamw_8bit",              # Sử dụng thuật toán tối ưu 8-bit để tiết kiệm tài nguyên GPU.
        seed=42,
        report_to="none",                # Tắt ghi nhận và tích hợp với Wandb.
    ),
)

# Hiển thị thông số VRAM trước khi huấn luyện
print(f"Thông số VRAM trước khi train - Allocated: {torch.cuda.memory_allocated()/1e9:.2f}GB")
print(f"Thông số VRAM trước khi train - Reserved:  {torch.cuda.memory_reserved()/1e9:.2f}GB")
print()

trainer.train()

# --- 5. LƯU LẠI MÔ HÌNH ĐÃ HUẤN LUYỆN (MERGED MODEL) ---
merged_dir = f"{OUTPUT_DIR}-merged"
print(f"\nĐang tiến hành lưu mô hình hoàn chỉnh (merged) vào {merged_dir}...")
model.save_pretrained_merged(
    merged_dir,
    tokenizer,
    save_method="merged_16bit"
)
print(f"   Mô hình hoàn chỉnh đã được lưu thành công tại thư mục: {merged_dir}/")
print(f"\n{'-' * 60}")
print("HOÀN THÀNH QUÁ TRÌNH HUẤN LUYỆN! Mô hình đã sẵn sàng để chuyển đổi sang định dạng GGUF.")
print("Bước tiếp theo: Thực hiện chạy lệnh python convert_to_gguf.py")
print("-" * 60)
