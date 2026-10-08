"use client";

import type { MouseEvent, ReactNode } from "react";

type ConfirmSubmitButtonProps = Readonly<{
  children: ReactNode;
  className?: string;
  confirmation: string;
}>;

export function ConfirmSubmitButton({
  children,
  className,
  confirmation,
}: ConfirmSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmation)) {
      event.preventDefault();
    }
  }

  return (
    <button className={className} onClick={handleClick} type="submit">
      {children}
    </button>
  );
}
