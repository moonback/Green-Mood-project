import { createContext, ReactElement, ReactNode, useContext, useEffect } from 'react';

const HelmetContext = createContext(true);

export function HelmetProvider({ children }: { children: ReactNode }) {
  return <HelmetContext.Provider value={true}>{children}</HelmetContext.Provider>;
}

function toElements(children: ReactNode): ReactElement[] {
  const array = Array.isArray(children) ? children : [children];
  return array.filter((child): child is ReactElement => Boolean(child) && typeof child === 'object' && 'type' in child);
}

function upsertHeadElement(el: Element) {
  if (el.tagName.toLowerCase() === 'title') {
    document.title = el.textContent ?? '';
    return;
  }

  const key =
    el.getAttribute('name') ||
    el.getAttribute('property') ||
    el.getAttribute('rel') ||
    el.getAttribute('href') ||
    el.getAttribute('charset') ||
    crypto.randomUUID();

  el.setAttribute('data-helmet-key', key);
  el.setAttribute('data-managed-helmet', 'true');

  const existing = document.head.querySelector(`[data-managed-helmet="true"][data-helmet-key="${CSS.escape(key)}"]`);
  if (existing) existing.replaceWith(el);
  else document.head.appendChild(el);
}

export function Helmet({ children }: { children: ReactNode }) {
  const enabled = useContext(HelmetContext);

  useEffect(() => {
    if (!enabled) return;

    const nodes = toElements(children);
    nodes.forEach((node) => {
      const tag = typeof node.type === 'string' ? node.type : null;
      if (!tag) return;

      const element = document.createElement(tag);
      const props = (node.props ?? {}) as Record<string, unknown>;
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'children' || value == null) return;
        const attr = key === 'charSet' ? 'charset' : key;
        element.setAttribute(attr, String(value));
      });

      if (typeof props.children === 'string') {
        element.textContent = props.children;
      }

      upsertHeadElement(element);
    });
  }, [children, enabled]);

  return null;
}
