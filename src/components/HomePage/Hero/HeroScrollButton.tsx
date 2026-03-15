"use client";

import Button from "../../shared/Button/Button";

export default function HeroScrollButton() {
 const handleClick = (
   e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
 ) => {
   e.preventDefault();
   const el = document.getElementById("learn-more");
   if (el) el.scrollIntoView({ behavior: "smooth" });
 };

  return (
    <Button
      href='/#learn-more'
      text="See how it's possible"
      btnType='accent'
      arrow
      onClick={handleClick}
    />
  );
}
