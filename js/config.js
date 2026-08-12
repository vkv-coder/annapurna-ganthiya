// Shared Supabase + notification config, loaded by every page before its own script.
const SUPABASE_URL = 'https://jqqnnkzozjskziaizajg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcW5ua3pvempza3ppYWl6YWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Mjk1ODAsImV4cCI6MjA4ODUwNTU4MH0.sEYeWnm0dvuw8bLSVnQhqmgV8LB-pELjpuVIa3Us1Gg';
const GAS_RELAY_URL = 'https://script.google.com/macros/s/AKfycbwNAxiSandIkgt4N6Df9eGzsaHsaIQHshvapiLdMpEsdtBX83jjAo5nCLLWMU4OqmMy/exec';
const SUPPORT_EMAIL = 'vkvcoder.support@gmail.com';
const STAFF_EMAIL_DOMAIN = '@ag.local';
const RESTAURANT_DISPLAY_NAME = 'Darsham Ganthiya';

// TEMPORARY TEST VALUE — this is the developer's personal UPI ID, used to prove out the
// pay-then-approve flow end to end. MUST be swapped for the restaurant's real business UPI ID
// (the same one printed on the physical table-card UPI QR) before accepting real customer orders.
const UPI_VPA = '7359016000@rbl';

// Primary client: persists the logged-in session (owner or staff) in localStorage.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Secondary client used only for creating new auth users (see manage-staff.html) so that
// signing up a new staff member never overwrites the owner's own active session.
function createEphemeralClient() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

// Fire-and-forget Telegram notification via the Google Apps Script relay.
// Uses text/plain to avoid a CORS preflight that most Apps Script deployments don't handle.
async function notifyTelegram(message) {
  try {
    await fetch(GAS_RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ message })
    });
  } catch (err) {
    console.error('Telegram relay notification failed:', err);
  }
}

// Builds the plain-text bill used for the WhatsApp self-tap link (order.html)
// and the counter's "Send Bill" button (counter-dashboard.html, later).
function buildBillText(tableNo, items, totalAmount, paymentMethod) {
  const lines = [];
  lines.push('*' + RESTAURANT_DISPLAY_NAME + '*');
  lines.push('Table ' + tableNo);
  lines.push('--------------------');
  items.forEach((item) => {
    lines.push(item.item_name + ' x' + item.qty + ' - ₹' + (item.price * item.qty));
  });
  lines.push('--------------------');
  lines.push('Total: ₹' + totalAmount);
  if (paymentMethod) {
    lines.push('Payment: ' + paymentMethod.toUpperCase());
  }
  lines.push('Thank you for visiting!');
  return lines.join('\n');
}

// Normalizes an Indian mobile number to the 91XXXXXXXXXX format wa.me expects.
function toWhatsAppNumber(mobile) {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

// Registers the PWA service worker (no-op if unsupported).
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }
}
