import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface PaymentFormInnerProps {
  amount: number;
  onSuccess: () => void;
  onError: (msg: string) => void;
  processing: boolean;
  setProcessing: (v: boolean) => void;
}

const PaymentFormInner = ({ amount, onSuccess, onError, processing, setProcessing }: PaymentFormInnerProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Payment failed");
      setProcessing(false);
    } else {
      onSuccess();
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-lg p-3">
        <Lock className="w-3 h-3 text-primary flex-shrink-0" />
        <span>Your payment info is encrypted and secure via Stripe.</span>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base"
        disabled={!stripe || processing}
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Processing…
          </span>
        ) : (
          `Pay PKR ${amount.toLocaleString()}`
        )}
      </Button>
    </form>
  );
};

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

const StripePaymentForm = ({ clientSecret, amount, onSuccess, onError }: StripePaymentFormProps) => {
  const [processing, setProcessing] = useState(false);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#f5c542",
            colorBackground: "#1a1a2e",
            colorText: "#e0e0e0",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentFormInner
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        processing={processing}
        setProcessing={setProcessing}
      />
    </Elements>
  );
};

export default StripePaymentForm;
