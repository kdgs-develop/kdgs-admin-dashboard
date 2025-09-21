"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart as ShoppingCartIcon,
  X,
  ImageIcon,
  FileText,
  Loader2
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { createCheckoutSession } from "@/lib/actions/stripe/create-checkout-session";

// Ensure Stripe public key is available
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface CartItem {
  ref: string;
  name: string;
  hasImages: boolean;
}

interface ShoppingCartProps {
  cartItems: CartItem[];
  onRemoveItem: (ref: string) => void;
  onClearCart: () => void;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  productPrice: string;
}

export function ShoppingCart({
  cartItems,
  onRemoveItem,
  onClearCart,
  setCartItems,
  productPrice
}: ShoppingCartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (cartItems.length === 0) {
    return null; // Don't render anything if cart is empty
  }

  // Filter for items that are eligible for purchase (have images)
  const itemsToPurchase = cartItems.filter(item => item.hasImages);
  const itemCount = itemsToPurchase.length;

  // Calculate total price based on eligible items and the fetched price
  const totalPrice = (itemCount * parseFloat(productPrice)).toFixed(2);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    if (!stripePromise) {
      setCheckoutError("Stripe configuration error. Please contact support.");
      setIsCheckingOut(false);
      return;
    }

    try {
      // Filter cart items to only include those with images before sending
      const itemsToCheckout = itemsToPurchase;
      if (itemsToCheckout.length === 0) {
        setCheckoutError(
          "Your cart contains no items eligible for checkout (missing images)."
        );
        setIsCheckingOut(false);
        return;
      }

      // Create the checkout session
      const { sessionId, error } = await createCheckoutSession(itemsToCheckout);

      if (error || !sessionId) {
        setCheckoutError(error || "Failed to create checkout session.");
        setIsCheckingOut(false);
        return;
      }

      // Clear the cart state BEFORE redirecting to prevent stale state
      onClearCart();

      // Force a rerender to ensure cart is cleared visually
      setCartItems([]);

      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe.js failed to load.");
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId
      });

      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        setCheckoutError(
          stripeError.message || "Failed to redirect to Stripe."
        );
        setIsCheckingOut(false); // Reset loading state if redirect fails
      }
    } catch (err) {
      console.error("Checkout handling error:", err);
      setCheckoutError("An unexpected error occurred during checkout.");
      setIsCheckingOut(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-24 md:bottom-16 right-6 h-14 w-14 rounded-full shadow-lg z-[999] 
                     bg-[#003B5C] hover:bg-[#004d7a] text-white"
          aria-label={`Shopping Cart: ${itemCount} items`}
        >
          <ShoppingCartIcon className="h-6 w-6" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 rounded-full px-2 py-0.5 text-xs font-semibold"
          >
            {itemCount}
          </Badge>
          <span className="sr-only">Open Shopping Cart</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4 mb-2" align="end" side="top">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Shopping Cart</h4>
            <p className="text-sm text-muted-foreground">
              Review items before checkout.
            </p>
          </div>
          <Separator />
          <div className="grid gap-0 max-h-60 overflow-y-auto px-1 -mx-1">
            {cartItems.map((item, index) => (
              <div
                key={item.ref}
                className={`grid grid-cols-[1fr_minmax(80px,_auto)_auto] items-start gap-2 group p-2 hover:bg-accent ${
                  index < cartItems.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col text-muted-foreground pt-1">
                    {item.hasImages ? (
                      <>
                        <span title="Image(s) included">
                          <ImageIcon className="h-3.5 w-3.5" />
                        </span>
                        <span title="PDF Report included" className="mt-0.5">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                      </>
                    ) : (
                      <div className="w-3.5 h-[calc(0.875rem+0.875rem+0.125rem)]"></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Ref: {item.ref}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary text-right pt-1 whitespace-nowrap">
                  ${productPrice} CAD
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                  onClick={() => onRemoveItem(item.ref)}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
          <Separator />
          <div className="grid grid-cols-[1fr_minmax(80px,_auto)_auto] items-center px-1 pt-2 gap-2">
            <span className="text-sm font-semibold text-left">Total:</span>
            <span className="text-sm font-bold text-right whitespace-nowrap">
              ${totalPrice} CAD
            </span>
            <div className="w-7 h-7"></div>
          </div>
          <p className="text-xs text-muted-foreground px-1 text-center">
            Transaction fees are included in the total price.
          </p>
          {checkoutError && (
            <p className="text-sm text-red-600 px-1 text-center">
              Error: {checkoutError}
            </p>
          )}
          <Button
            onClick={handleCheckout}
            disabled={isCheckingOut || !stripePromise}
            className="w-full mt-2"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
