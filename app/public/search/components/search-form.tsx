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
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon, Loader2, PlusIcon, XIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FamilyRelationship } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const relativeSchema = z.object({
  name: z.string().optional(),
  relationshipId: z.string().optional()
});

const searchFormSchema = z.object({
  surname: z.string().optional(),
  givenNames: z.string().optional(),
  alsoKnownAs: z.string().optional(),
  relatives: z.array(relativeSchema).optional(),
  // Exact Birth Date
  birthDay: z
    .string()
    .optional()
    .refine(val => !val || /^\d{1,2}$/.test(val), "Invalid day"),
  birthMonth: z
    .string()
    .optional()
    .refine(val => !val || /^\d{1,2}$/.test(val), "Invalid month"),
  birthYear: z
    .string()
    .optional()
    .refine(val => !val || /^\d{4}$/.test(val), "Invalid year"),
  // Birth Year Range
  birthYearFrom: z
    .string()
    .optional()
    .refine(val => !val || /^\d{4}$/.test(val), "Invalid year"),
  birthYearTo: z
    .string()
    .optional()
    .refine(val => !val || /^\d{4}$/.test(val), "Invalid year"),
  birthPlace: z.string().optional(),
  // Exact Death Date
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
  // Death Year Range
  deathYearFrom: z
    .string()
    .optional()
    .refine(val => !val || /^\d{4}$/.test(val), "Invalid year"),
  deathYearTo: z
    .string()
    .optional()
    .refine(val => !val || /^\d{4}$/.test(val), "Invalid year"),
  deathPlace: z.string().optional()
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface SearchFormProps {
  relationships: FamilyRelationship[];
}

export function SearchForm({ relationships }: SearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      surname: "",
      givenNames: "",
      alsoKnownAs: "",
      relatives: [{ name: "", relationshipId: "" }], // Start with one empty relative row
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      birthYearFrom: "",
      birthYearTo: "",
      birthPlace: "",
      deathDay: "",
      deathMonth: "",
      deathYear: "",
      deathYearFrom: "",
      deathYearTo: "",
      deathPlace: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relatives"
  });

  async function onSubmit(data: SearchFormValues) {
    setIsLoading(true);
    try {
      // Filter out empty relative rows before submitting
      const processedData = {
        ...data,
        relatives: data.relatives?.filter(
          relative => relative.name || relative.relationshipId
        )
      };
      console.log("Processed Search Data:", processedData);
      // TODO: Implement search functionality with processedData
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
          {/* Name & Relatives Information */}
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 p-0">
              <div className="space-y-2">
                <h3 className="font-medium text-[#003B5C]">
                  Person & Relatives
                </h3>
                <p className="text-sm text-gray-500">
                  Enter details about the person and their relatives
                </p>
              </div>

              <div className="space-y-4">
                {/* Person Name Fields */}
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
                        Given Names
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter given names"
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
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Relatives Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <FormLabel className="text-[#003B5C] font-medium">
                  Relatives
                </FormLabel>
                {fields.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="grid grid-cols-2 gap-4 flex-grow">
                      <FormField
                        control={form.control}
                        name={`relatives.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Relative's Name"
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
                        name={`relatives.${index}.relationshipId`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg">
                                  <SelectValue placeholder="Relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {relationships.map(rel => (
                                  <SelectItem key={rel.id} value={rel.id}>
                                    {rel.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                  onClick={() => append({ name: "", relationshipId: "" })}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Relative
                </Button>
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
                  <Tabs defaultValue="exact" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="exact">Exact Date</TabsTrigger>
                      <TabsTrigger value="range">Year Range</TabsTrigger>
                    </TabsList>
                    <TabsContent value="exact">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="birthDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Day
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="DD"
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
                          name="birthMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Month
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="MM"
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
                          name="birthYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Year
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="YYYY"
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
                    <TabsContent value="range">
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
                  <FormField
                    control={form.control}
                    name="birthPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#003B5C] font-medium">
                          Birth Place
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, County, State, Province, or Country"
                            {...field}
                            className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Death Information */}
                <div className="space-y-4">
                  <p className="font-medium text-[#003B5C] text-sm">
                    Death Information
                  </p>
                  <Tabs defaultValue="exact" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="exact">Exact Date</TabsTrigger>
                      <TabsTrigger value="range">Year Range</TabsTrigger>
                    </TabsList>
                    <TabsContent value="exact">
                      <div className="grid grid-cols-3 gap-4">
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
                                  placeholder="DD"
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
                          name="deathMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Month
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="MM"
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
                          name="deathYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#003B5C] font-medium">
                                Year
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="YYYY"
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
                                  placeholder="YYYY"
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
                                  placeholder="YYYY"
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

                  <FormField
                    control={form.control}
                    name="deathPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#003B5C] font-medium">
                          Death Place
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, County, State, Province, or Country"
                            {...field}
                            className="border-gray-200 focus:border-[#003B5C] focus:ring-[#003B5C] rounded-lg"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit/Clear buttons */}
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
