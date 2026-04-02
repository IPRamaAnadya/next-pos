// Fix phone number to start with 62 (Indonesian format)
export function fixPhoneNumber(phone: string): string {
  if (!phone) return '';
  phone = phone.replace(/\D/g, ''); // Remove non-digit chars
  if (phone.startsWith('0')) {
    return '62' + phone.slice(1);
  }
  if (phone.startsWith('62')) {
    return phone;
  }
  // If not starting with 0 or 62, skip modification (return original)
  return phone;
}

// Encode message for URL
export function encodeMessage(message: string): string {
  return encodeURIComponent(message);
}
