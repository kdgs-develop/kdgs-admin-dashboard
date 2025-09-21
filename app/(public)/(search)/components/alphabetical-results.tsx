"use client";

import { useState, useTransition, useCallback } from "react";
import { SearchResult } from "@/lib/actions/public-search/search-obituaries";
import { SessionData } from "@/lib/session";
import { getObituariesByLetter } from "../surname/[letter]/actions";
import { SearchResults } from "./search-results";
import { RequestObituaryDialog } from "./request-obituary-dialog";
import { LoginDialog } from "@/app/(public)/components/login-dialog";
import { ShoppingCart } from "@/app/(public)/components/shopping-cart";

// Update CartItem type to match the main search form
interface CartItem {
  ref: string;
  name: string;
  hasImages: boolean;
}

interface AlphabeticalResultsProps {
  initialResults: SearchResult[];
  totalCount: number;
  letter: string;
  session: SessionData | null;
  pageSize: number;
  productPrice: string;
}

export function AlphabeticalResults({
  initialResults,
  totalCount,
  letter,
  session,
  pageSize,
  productPrice
}: AlphabeticalResultsProps) {
  const [results, setResults] = useState(initialResults);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedObituary, setSelectedObituary] = useState<{
    ref: string;
    name: string;
  } | null>(null);

  // Add shopping cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > Math.ceil(totalCount / pageSize)) return;

    startTransition(async () => {
      setError(null);
      const response = await getObituariesByLetter(letter, page);
      if (response.error) {
        setError(response.error);
      } else {
        setResults(response.results);
        setCurrentPage(page);
        window.scrollTo(0, 0);
      }
    });
  };

  const handleOpenRequestDialog = (
    obituaryRef: string,
    obituaryName: string
  ) => {
    setSelectedObituary({ ref: obituaryRef, name: obituaryName });
    setDialogOpen(true);
  };

  // Handler for triggering sign-in
  const handleSignInRequest = useCallback(() => {
    console.log("Sign In requested from RequestObituaryDialog");
    // Close the request dialog
    setDialogOpen(false);
    // Open the login dialog
    setIsLoginDialogOpen(true);
  }, []);

  // Handler to add items to cart
  const handleAddToCart = useCallback(
    (obituaryRef: string, obituaryName: string, hasImages: boolean) => {
      setCartItems(prevCart => {
        if (prevCart.some(item => item.ref === obituaryRef)) {
          console.log(`Item ${obituaryRef} already in cart.`);
          return prevCart;
        }
        const newItem: CartItem = {
          ref: obituaryRef,
          name: obituaryName,
          hasImages: hasImages
        };
        console.log("Adding to cart:", newItem);
        return [...prevCart, newItem];
      });
    },
    []
  );

  // Handler to remove an item from the cart
  const handleRemoveFromCart = useCallback((obituaryRef: string) => {
    setCartItems(prevCart => {
      const updatedCart = prevCart.filter(item => item.ref !== obituaryRef);
      console.log(`Removed ${obituaryRef} from cart. New cart:`, updatedCart);
      return updatedCart;
    });
  }, []);

  // Handler to clear the entire cart
  const handleClearCart = useCallback(() => {
    setCartItems([]);
    console.log("Cart cleared");
  }, []);

  return (
    <>
      <SearchResults
        results={results}
        isLoading={isPending}
        error={error}
        hasSearched={true}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}} // Not used here
        onOpenRequestDialog={handleOpenRequestDialog}
        isLoggedIn={!!session?.isLoggedIn}
        showPageSizeChanger={false} // Hide the page size selector
      />

      {/* Shopping Cart */}
      <ShoppingCart
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        setCartItems={setCartItems}
        productPrice={productPrice}
      />

      {/* Request Obituary Dialog */}
      {selectedObituary && (
        <RequestObituaryDialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          session={session}
          obituaryRef={selectedObituary.ref}
          obituaryName={selectedObituary.name}
          onSignInRequest={handleSignInRequest}
          onAddToCart={handleAddToCart}
          productPrice={productPrice}
        />
      )}

      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      />
    </>
  );
}
