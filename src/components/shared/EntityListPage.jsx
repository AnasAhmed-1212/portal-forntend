import React from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const EntityListPage = ({
  eyebrow = "Workspace",
  title,
  description,
  addLabel,
  addPath,
  searchPlaceholder,
  searchValue,
  onSearch,
  children,
  headerAside,
}) => (
  <div className="page-shell">
    <div className="page-container">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="secondary" className="mb-3">{eyebrow}</Badge>
          <h1 className="page-heading">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {headerAside}
          {addPath && (
            <Button asChild size="lg" className="h-10">
              <Link to={addPath}><Plus />{addLabel}</Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-4 gap-0 py-0">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchValue}
              placeholder={searchPlaceholder}
              className="h-10 pl-9"
              onChange={onSearch}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="p-2 sm:p-3">{children}</CardContent>
      </Card>
    </div>
  </div>
);

export default EntityListPage;
