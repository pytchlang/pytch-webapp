import React, { useId } from "react";

type SectionWithHiddenH2Props = React.HTMLAttributes<HTMLElement> &
  React.RefAttributes<HTMLElement> & { headingContent: React.ReactNode };

export const SectionWithHiddenH2: React.FC<
  React.PropsWithChildren<SectionWithHiddenH2Props>
> = ({ headingContent, children, ...sectionProps }) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} {...sectionProps}>
      <h2 id={headingId} className="visually-hidden">
        {headingContent}
      </h2>
      {children}
    </section>
  );
};
