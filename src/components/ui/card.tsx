import React from "react";
import { cn } from "@/library/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, children, ...rest }) => {
  return (
    <div className={cn("rounded-2xl bg-white/5 border border-white/10", className)} {...rest}>
      {children}
    </div>
  );
};

export default Card;







