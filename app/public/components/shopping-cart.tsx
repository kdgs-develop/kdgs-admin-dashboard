"use client";

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
  FileText
} from "lucide-react";

interface CartItem {
  ref: string;
  name: string;
  hasImages: boolean;
}

interface ShoppingCartProps {
  cartItems: CartItem[];
  onRemoveItem: (ref: string) => void;
  // onCheckout: () => void; // Add later for Stripe integration
}

export function ShoppingCart({ cartItems, onRemoveItem }: ShoppingCartProps) {
  if (cartItems.length === 0) {
    return null; // Don't render anything if cart is empty
  }

  const itemCount = cartItems.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-16 right-6 h-14 w-14 rounded-full shadow-lg z-[999] 
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
                className={`flex items-center justify-between group p-2 hover:bg-accent 
                            ${index < cartItems.length - 1 ? "border-b" : ""}`}
              >
                <div className="flex items-center gap-2">
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
                    <span className="text-sm font-medium truncate max-w-[160px]">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Ref: {item.ref}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveItem(item.ref)}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
          <Separator />
          <Button
            disabled // Disabled until Stripe is connected
            className="w-full"
            // onClick={onCheckout} // Add later
          >
            Proceed to Checkout (Coming Soon)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
