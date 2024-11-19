"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin } from "lucide-react";

interface PostcodeAutocompleteProps {
  onSelect: (result: any) => void;
}

export default function PostcodeAutocomplete({ onSelect }: PostcodeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchPostcode = async () => {
      if (value.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search across multiple countries for matching postcodes
        const countries = ["US", "GB", "CA", "AU", "DE", "FR", "IT", "ES"];
        const searches = countries.map(async (country) => {
          try {
            const response = await fetch(
              `https://api.zippopotam.us/${country.toLowerCase()}/${value}`
            );
            if (response.ok) {
              const data = await response.json();
              return {
                ...data,
                country_code: country,
              };
            }
          } catch (error) {
            // Silently fail individual country searches
            return null;
          }
        });

        const results = (await Promise.all(searches)).filter(Boolean);
        setResults(results);
      } catch (error) {
        console.error("Error searching postcodes:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchPostcode, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          placeholder="Enter postcode here.."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full"
        />
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Enter postcode here.." value={value} onValueChange={setValue} />
          <CommandList>
            <CommandEmpty>
              {loading ? "Searching..." : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {results.map((result, index) => (
                <CommandItem
                  key={`${result.country_code}-${result["post code"]}-${index}`}
                  onSelect={() => {
                    onSelect(result);
                    setOpen(false);
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  <span className="font-medium">{result["post code"]}</span>
                  <span className="ml-2 text-muted-foreground">
                    {result.places[0]["place name"]}, {result.country}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}