import { useState } from 'react';
import api from '@/lib/axios';
import { loadRazorpay } from '@/lib/razorpay';
import { toast } from 'react-hot-toast';

export const useRazorpayPayment = (onSuccessCallback: () => void) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async (paymentId: string, hackathonName: string, userName: string, userEmail: string = "user@example.com") => {
        setIsProcessing(true);
        try {
            const hasLoaded = await loadRazorpay();
            if (!hasLoaded) {
                toast.error("Failed to load Razorpay SDK. Please check your connection.");
                setIsProcessing(false);
                return;
            }

            // Create Order
            const { data: orderRes } = await api.post('/payments/create-order', { paymentId });
            
            if (orderRes.status !== 'success') {
                throw new Error("Failed to create order");
            }

            const { orderId, amount, currency, key_id } = orderRes.orderDetails;

            const options = {
                key: key_id,
                amount: amount.toString(),
                currency: currency,
                name: "CodeDabba",
                description: `Payment for ${hackathonName}`,
                order_id: orderId,
                handler: async function (response: any) {
                    try {
                        const { data: verifyRes } = await api.post('/payments/verify', {
                            paymentId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        if (verifyRes.status === 'success') {
                            toast.success("Payment verified successfully!");
                            onSuccessCallback();
                        } else {
                            toast.error("Payment verification failed.");
                        }
                    } catch (error: any) {
                        toast.error(error.response?.data?.message || "Verification failed on server");
                    }
                },
                prefill: {
                    name: userName,
                    email: userEmail,
                },
                theme: {
                    color: "#8b5cf6" // violet-500
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            
            paymentObject.on('payment.failed', function (response: any) {
                toast.error(response.error.description || "Transaction failed");
                api.post(`/payments/${paymentId}/fail`, { transactionId: response.error.metadata.payment_id }).catch(() => {});
            });

            paymentObject.open();

        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || "An error occurred initializing payment");
        } finally {
            setIsProcessing(false);
        }
    };

    return { handlePayment, isProcessing };
};
