import React from "react";
export default function PageHeading({
  eyebrow,
  title,
  accent,
  description,
  children,
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>
          {title}
          {accent && (
            <>
              {" "}
              <span>{accent}</span>
            </>
          )}
        </h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </header>
  );
}
