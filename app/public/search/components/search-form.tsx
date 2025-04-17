"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon, Loader2 } from "lucide-react";

const searchFormSchema = z.object({
  surname: z.string().optional(),
  givenNames: z.string().optional(),
  alsoKnownAs: z.string().optional(),
  relativeName: z.string().optional(),
  birthYearFrom: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}$/.test(val),
      "Please enter a valid year (YYYY)"
    ),
  birthYearTo: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}$/.test(val),
      "Please enter a valid year (YYYY)"
    ),
  birthPlace: z.string().optional(),
  deathYearFrom: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}$/.test(val),
      "Please enter a valid year (YYYY)"
    ),
  deathYearTo: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{4}$/.test(val),
      "Please enter a valid year (YYYY)"
    ),
  deathPlace: z.string().optional()
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export function SearchForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      surname: "",
      givenNames: "",
      alsoKnownAs: "",
      relativeName: "",
      birthYearFrom: "",
      birthYearTo: "",
      birthPlace: "",
      deathYearFrom: "",
      deathYearTo: "",
      deathPlace: ""
    }
  });

  async function onSubmit(data: SearchFormValues) {
    setIsLoading(true);
    try {
      // TODO: Implement search functionality
      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Name Information */}
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              <div className="space-y-2">
                <h3 className="font-medium text-[#003B5C]">Name Details</h3>
                <p className="text-sm text-gray-500">
                  Enter any known names of the person
                </p>
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
                          placeholder="Enter surname"
                          {...field}
                          className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-[#8B0000]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="givenNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003B5C] font-medium">
                        Given Names
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter given names"
                          {...field}
                          className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-[#8B0000]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alsoKnownAs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003B5C] font-medium">
                        Also Known As
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter alternate names"
                          {...field}
                          className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-[#8B0000]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relativeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003B5C] font-medium">
                        Relative&apos;s Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter relative's name"
                          {...field}
                          className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-[#8B0000]" />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Life Events Information */}
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              <div className="space-y-2">
                <h3 className="font-medium text-[#003B5C]">Life Events</h3>
                <p className="text-sm text-gray-500">
                  Add birth and death information if known
                </p>
              </div>

              <div className="space-y-6">
                {/* Birth Information */}
                <div className="space-y-4">
                  <p className="font-medium text-[#003B5C] text-sm">
                    Birth Information
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="birthYearFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#003B5C] font-medium">
                            Year From
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="YYYY"
                              {...field}
                              className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-[#8B0000]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birthYearTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#003B5C] font-medium">
                            Year To
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="YYYY"
                              {...field}
                              className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-[#8B0000]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="birthPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#003B5C] font-medium">
                          Place
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, County, State, Province, or Country"
                            {...field}
                            className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                          />
                        </FormControl>
                        <FormMessage className="text-[#8B0000]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Death Information */}
                <div className="space-y-4">
                  <p className="font-medium text-[#003B5C] text-sm">
                    Death Information
                  </p>
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
                              placeholder="YYYY"
                              {...field}
                              className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-[#8B0000]" />
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
                              placeholder="YYYY"
                              {...field}
                              className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-[#8B0000]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="deathPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#003B5C] font-medium">
                          Place
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, County, State, Province, or Country"
                            {...field}
                            className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                          />
                        </FormControl>
                        <FormMessage className="text-[#8B0000]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button
            type="submit"
            className="bg-[#8B0000] hover:bg-[#6d0000] text-white px-8 py-2 h-11 rounded-lg transition-colors"
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
            onClick={() => form.reset()}
            disabled={isLoading}
            className="border-[#003B5C] text-[#003B5C] hover:bg-[#003B5C] hover:text-white px-8 py-2 h-11 rounded-lg transition-colors"
          >
            Clear
          </Button>
        </div>
      </form>
    </Form>
  );
}
