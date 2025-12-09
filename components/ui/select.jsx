"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

function Select({ className, children, placeholder, value, onValueChange, onChange, ...props }) {
  function renderOptions(nodes) {
    const arr = React.Children.toArray(nodes);
    return arr.map((node, idx) => {
      if (!React.isValidElement(node)) return null;
      const typeName = node.type?.displayName;
      if (typeName === "SelectContent") {
        return renderOptions(node.props.children);
      }
      if (typeName === "SelectGroup") {
        const kids = React.Children.toArray(node.props.children);
        const labelNode = kids.find((c) => React.isValidElement(c) && c.type?.displayName === "SelectLabel");
        const items = kids.filter((c) => React.isValidElement(c) && c.type?.displayName === "SelectItem");
        const label = labelNode ? labelNode.props.children : undefined;
        if (label) {
          return (
            <optgroup key={`g-${idx}`} label={label}>
              {items.map((it, i) => (
                <option key={`o-${idx}-${i}`} value={it.props.value}>{it.props.children}</option>
              ))}
            </optgroup>
          );
        }
        return items.map((it, i) => (
          <option key={`o-${idx}-${i}`} value={it.props.value}>{it.props.children}</option>
        ));
      }
      if (typeName === "SelectItem") {
        return <option key={`o-${idx}`} value={node.props.value}>{node.props.children}</option>;
      }
      return null;
    });
  }
  const handleChange = (e) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };
  return (
    <div className="relative">
      <select
        data-slot="select"
        value={value}
        onChange={handleChange}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "appearance-none pr-8",
          className
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {renderOptions(children)}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-2 top-1/2 -mt-2 size-4 text-muted-foreground"
      >
        <path d="M5 7l5 5 5-5" fill="currentColor" />
      </svg>
    </div>
  )
}

function SelectContent({ children }) {
  return <>{children}</>;
}
SelectContent.displayName = "SelectContent";

function SelectGroup({ children }) {
  return <>{children}</>;
}
SelectGroup.displayName = "SelectGroup";

function SelectLabel({ children }) {
  return <>{children}</>;
}
SelectLabel.displayName = "SelectLabel";

function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
SelectItem.displayName = "SelectItem";

function SelectTrigger({ className, children }) {
  return <div className={cn("h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm", className)}>{children}</div>;
}
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }) {
  return <span className="text-muted-foreground">{placeholder}</span>;
}
SelectValue.displayName = "SelectValue";

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue }
