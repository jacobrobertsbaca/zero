import { Budget } from "src/types/budget/types";
import { CategoryListClient, CategoryCard } from "./category-list-client";

export function CategoryList({ budget }: { budget: Budget }) {
  return (
    <CategoryListClient budget={budget}>
      {budget.categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </CategoryListClient>
  );
}
