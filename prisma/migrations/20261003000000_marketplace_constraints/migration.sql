-- AlterTable
-- Add unique constraint to users.phone to ensure one account per phone number
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- Add composite unique constraint to top_up_requests
CREATE UNIQUE INDEX "top_up_requests_seller_id_reference_code_key" ON "top_up_requests"("seller_id", "reference_code");

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
