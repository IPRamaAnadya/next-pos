
import Midtrans, { Snap } from 'midtrans-client';

const snap = new Snap({
	isProduction: process.env.MIDTRANS_PRODUCTION === 'true',
	serverKey: process.env.MIDTRANS_SERVER_KEY || '',
	clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
});

/**
 * Create a Midtrans Snap transaction for a subscription payment.
 * @param {Object} params
 * @param {string} params.midtransOrderId - The order ID (should match midtransOrderId in SubscriptionPayment)
 * @param {number} params.amount - The amount (should match amount in SubscriptionPayment)
 * @param {Object} params.customer - { name, email, phone }
 * @param {Object[]} params.items - Array of item details (id, price, quantity, name)
 * @param {string[]} [params.enabledPayments] - Array of enabled payment method codes
 * @param {Object} [params.callbacks] - { finish, unfinish, error }
 * @returns {Promise<string>} Snap token
 */
export async function createSnapTransaction({ midtransOrderId, amount, customer, items, enabledPayments, callbacks }) {
	const parameter = {
		transaction_details: {
			order_id: midtransOrderId,
			gross_amount: amount,
		},
		credit_card: {
			secure: true,
		},
		customer_details: {
			first_name: customer.name,
			email: customer.email,
			phone: customer.phone,
		},
		item_details: items,
		enabled_payments: enabledPayments,
		callbacks: callbacks,
	};

	try {
		const transaction = await snap.createTransaction(parameter);
		return transaction.token;
	} catch (e) {
		console.error('Error creating Midtrans transaction:', e);
		throw e;
	}
}

export async function verifyWebhookNotification(notification) {
	const apiClient = new Midtrans.CoreApi({
		isProduction: process.env.MIDTRANS_PRODUCTION === 'true',
		serverKey: process.env.MIDTRANS_SERVER_KEY || '',
	});
	try {
		const transactionStatus = await apiClient.transaction.status(notification.transaction_id);
		return transactionStatus.signature_key === notification.signature_key;
	} catch (e) {
		return false;
	}
}
