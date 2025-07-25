"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon, Loader2, PlusIcon, XIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  searchObituaries,
  SearchResponse
} from "@/lib/actions/public-search/search-obituaries";
import { SearchResults } from "./search-results";
import type { SessionData } from "@/lib/session";
import { RequestObituaryDialog } from "./request-obituary-dialog";
import { LoginDialog } from "@/app/public/components/login-dialog";
import { ShoppingCart } from "@/app/public/components/shopping-cart";

// Update CartItem type
interface CartItem {
  ref: string;
  name: string;
  hasImages: boolean; // Add flag for image/PDF availability
}

// Interface for the data passed to the request dialog
interface SelectedRecordData {
  obituaryReference: string;
  obituaryName: string;
}

const relativeSchema = z.object({
  surname: z
    .string()
    .optional()
    .transform(val => val?.toUpperCase()),
  givenNames: z.string().optional()
});

const searchFormSchema = z
  .object({
    surname: z
      .string()
      .optional()
      .transform(val => val?.toUpperCase()),
    givenNames: z.string().optional(),
    relatives: z.array(relativeSchema).optional(),
    deathDay: z
      .string()
      .optional()
      .refine(val => !val || /^\d{1,2}$/.test(val), "Invalid day"),
    deathMonth: z
      .string()
      .optional()
      .refine(val => !val || /^\d{1,2}$/.test(val), "Invalid month"),
    deathYear: z
      .string()
      .optional()
      .refine(val => !val || /^\d{4}$/.test(val), "Invalid year"),
    deathYearFrom: z
      .string()
      .optional()
      .refine(val => !val || /^\d{4}$/.test(val), "Invalid year"),
    deathYearTo: z
      .string()
      .optional()
      .refine(val => !val || /^\d{4}$/.test(val), "Invalid year")
  })
  .refine(
    data => {
      // If deathDay is provided but either deathYear or deathMonth is not, return false
      if (data.deathDay && (!data.deathYear || !data.deathMonth)) {
        return false;
      }
      return true;
    },
    {
      message: "Please provide both year and month when searching by day",
      path: ["deathDay"] // This will show the error on the deathDay field
    }
  );

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface CurrentSearchCriteria extends SearchFormValues {
  deathDateType: "exact" | "range";
}

interface SearchFormProps {
  session?: SessionData | null;
  productPrice: string;
}

export function SearchForm({ session, productPrice }: SearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [deathDateType, setDeathDateType] = useState<"exact" | "range">(
    "exact"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentSearchCriteria, setCurrentSearchCriteria] =
    useState<CurrentSearchCriteria | null>(null);

  // State for the request dialog
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<SelectedRecordData | null>(null); // Consolidated state

  // State for the login dialog
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  // State for the shopping cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Determine login status
  const isLoggedIn = session?.isLoggedIn ?? false;

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      surname: "",
      givenNames: "",
      relatives: [{ surname: "", givenNames: "" }],
      deathDay: "",
      deathMonth: "",
      deathYear: "",
      deathYearFrom: "",
      deathYearTo: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relatives"
  });

  const performSearch = useCallback(
    async (criteria: CurrentSearchCriteria, page: number, size: number) => {
      setIsLoading(true);
      setSearchData(null);
      setSearchError(null);
      setHasSearched(true);

      try {
        const relatives = criteria.relatives?.filter(
          relative => relative.surname || relative.givenNames
        );

        const searchInput = {
          ...criteria,
          relatives,
          page: page,
          pageSize: size
        };

        console.log("Sending Search Input:", searchInput);

        const { data, error } = await searchObituaries(searchInput);

        if (error) {
          setSearchError(error);
          setSearchData(null);
        } else if (data) {
          setSearchData(data);
          setSearchError(null);
        } else {
          setSearchData({ results: [], totalCount: 0 });
          setSearchError(null);
        }
      } catch (error) {
        console.error("Search execution error:", error);
        setSearchError("An unexpected error occurred during the search.");
        setSearchData(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handler to open the request dialog
  const handleOpenRequestDialog = (
    obituaryReference: string,
    obituaryName: string
  ) => {
    setSelectedRecord({ obituaryReference, obituaryName });
    setIsRequestDialogOpen(true);
  };

  // Handler to close the request dialog
  const handleCloseRequestDialog = () => {
    setIsRequestDialogOpen(false);
    setSelectedRecord(null); // Reset selected record on close
  };

  // Handler for closing the login dialog
  const handleCloseLoginDialog = () => {
    setIsLoginDialogOpen(false);
  };

  // Placeholder handler for triggering sign-in
  const handleSignInRequest = useCallback(() => {
    console.log("Sign In requested from RequestObituaryDialog");
    // Close the request dialog
    setIsRequestDialogOpen(false);
    // Open the login dialog
    setIsLoginDialogOpen(true);
  }, []);

  // Update handler to accept and store hasImages
  const handleAddToCart = useCallback(
    (obituaryRef: string, obituaryName: string, hasImages: boolean) => {
      setCartItems(prevCart => {
        if (prevCart.some(item => item.ref === obituaryRef)) {
          console.log(`Item ${obituaryRef} already in cart.`);
          // toast({ title: "Item already in cart" });
          return prevCart;
        }
        const newItem: CartItem = {
          ref: obituaryRef,
          name: obituaryName,
          hasImages: hasImages // Store the flag
        };
        console.log("Adding to cart:", newItem);
        // toast({ title: "Item Added" });
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
      // Optionally show toast notification for removal
      // toast({ title: "Item Removed", description: `Item with ref ${obituaryRef} removed from cart.` });
      return updatedCart;
    });
  }, []);

  // Handler to clear the entire cart
  const handleClearCart = useCallback(() => {
    setCartItems([]);
    console.log("Cart cleared");
  }, []);

  async function onSubmit(formData: SearchFormValues) {
    const newCriteria: CurrentSearchCriteria = {
      ...formData,
      deathDateType: deathDateType
    };
    setCurrentSearchCriteria(newCriteria);
    setCurrentPage(1);
    await performSearch(newCriteria, 1, pageSize);
  }

  const handlePageChange = (newPage: number) => {
    if (!currentSearchCriteria || isLoading) return;
    setCurrentPage(newPage);
    performSearch(currentSearchCriteria, newPage, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (!currentSearchCriteria || isLoading) return;
    setPageSize(newPageSize);
    setCurrentPage(1);
    performSearch(currentSearchCriteria, 1, newPageSize);
  };

  const handleClear = () => {
    form.reset();
    setSearchData(null);
    setSearchError(null);
    setHasSearched(false);
    setCurrentPage(1);
    setPageSize(10);
    setCurrentSearchCriteria(null);
    setSelectedRecord(null);
    setIsRequestDialogOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Deceased Subject Section */}
          <Card className="border-gray-200 shadow-sm rounded-lg">
            <CardContent className="space-y-6 p-6 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <h3 className="font-medium text-[#003B5C]">
                  Deceased Subject (Start Here)
                </h3>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003B5C] font-medium">
                        Surname
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter surname (will also search maiden names)"
                          {...field}
                          className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="givenNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003B5C] font-medium">
                        Given Name(s)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter given names (Optional)"
                          {...field}
                          className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Optional Sections Accordion */}
          <Accordion type="multiple" className="space-y-4">
            {/* Relatives Section */}
            <AccordionItem
              value="relatives"
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 bg-green-50 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="font-medium text-[#003B5C]">
                    Relatives (Optional)
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-green-50">
                <div className="space-y-4">
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="grid grid-cols-2 gap-4 flex-grow">
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.surname`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Surname
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Surname (Optional)"
                                  {...field}
                                  className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`relatives.${index}.givenNames`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Given Name(s)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Given Names (Optional)"
                                  {...field}
                                  className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-100 mt-1"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 border-[#003B5C] text-[#003B5C] hover:bg-[#003B5C] hover:text-white"
                    onClick={() => append({ surname: "", givenNames: "" })}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Relative
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Death Information Section */}
            <AccordionItem
              value="death-info"
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 bg-gray-100 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="font-medium text-[#003B5C]">
                    Death Information (Optional)
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-gray-100">
                <div className="space-y-4">
                  <Tabs
                    defaultValue="exact"
                    className="w-full"
                    onValueChange={value =>
                      setDeathDateType(value as "exact" | "range")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="exact">Exact Date</TabsTrigger>
                      <TabsTrigger value="range">Year Range</TabsTrigger>
                    </TabsList>
                    <TabsContent value="exact">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="deathYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Year
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="YYYY (Optional)"
                                  {...field}
                                  maxLength={4}
                                  className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deathMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Month
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="MM (Optional)"
                                  {...field}
                                  maxLength={2}
                                  className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deathDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Day
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="DD (Optional)"
                                  {...field}
                                  maxLength={2}
                                  className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="range">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="deathYearFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Year From
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="YYYY (Optional)"
                                  {...field}
                                  maxLength={4}
                                  className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deathYearTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Year To
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="YYYY (Optional)"
                                  {...field}
                                  maxLength={4}
                                  className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 h-11 rounded-lg transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <SearchIcon className="mr-2 h-4 w-4" />
                Search Records
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isLoading}
            className="border-[#003B5C] text-[#003B5C] hover:bg-[#003B5C] hover:text-white px-8 py-2 h-11 rounded-lg transition-colors"
          >
            Clear
          </Button>
        </div>
      </form>
      {hasSearched && !isLoading && searchData && (
        <SearchResults
          results={searchData.results}
          totalCount={searchData.totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onOpenRequestDialog={handleOpenRequestDialog}
          isLoading={isLoading}
          error={searchError}
          hasSearched={hasSearched}
          isLoggedIn={isLoggedIn}
          isPartialMatch={searchData.isPartialMatch}
        />
      )}

      {/* Request Obituary Dialog */}
      {selectedRecord && (
        <RequestObituaryDialog
          isOpen={isRequestDialogOpen}
          onOpenChange={handleCloseRequestDialog}
          session={session ?? null}
          obituaryRef={selectedRecord.obituaryReference}
          obituaryName={selectedRecord.obituaryName}
          onSignInRequest={handleSignInRequest}
          onAddToCart={handleAddToCart}
          productPrice={productPrice}
        />
      )}

      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onOpenChange={handleCloseLoginDialog}
      />

      {/* Floating Shopping Cart */}
      <ShoppingCart
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        setCartItems={setCartItems}
        productPrice={productPrice}
      />
    </Form>
  );
}
