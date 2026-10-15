export type ReaderPreferences = {
  language: "pt-BR" | "en" | "es";
  theme: "light" | "sepia" | "dark" | "black" | "auto";
  font: "Georgia" | "Literata" | "Atkinson Hyperlegible Next" | "Lexend";
  fontSize: number;
  width: number;
  widthMode: "custom" | "full";
  widthPercent: number;
  lineHeight: number;
  alignment: "left" | "center" | "right" | "justify";
  speed: number;
};
export type ToolbarLabels = {
  toolbar: string;
  close: string;
  openPdf: string;
  themes: string[];
  theme: string;
  font: string;
  decrease: string;
  increase: string;
  width: string;
  line: string;
  align: string;
  left: string;
  center: string;
  right: string;
  justify: string;
  index: string;
  start: string;
  pause: string;
  speed: string;
  progress: string;
  size: string;
  more: string;
  print: string;
  chooseTheme: string;
  chooseFont: string;
  chooseAlignment: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  alignJustify: string;
};
const paths = {
  index: '<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  print: '<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7Z"/><path d="M17 11h.01"/>',
  left: '<path d="M3 5h18M3 10h12M3 15h18M3 20h12"/>',
  center: '<path d="M3 5h18M6 10h12M3 15h18M6 20h12"/>',
  right: '<path d="M3 5h18M9 10h12M3 15h18M9 20h12"/>',
  justify: '<path d="M3 5h18M3 10h18M3 15h18M3 20h18"/>',
};
const icon = (name: keyof typeof paths) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
type Choice = { value: string; label: string; preview: string; accessible: string; family?: string };
type Group = { key: string; element: HTMLElement; compact?: boolean };

export function createReaderToolbar(
  preferences: ReaderPreferences,
  ui: ToolbarLabels,
  callbacks: {
    change: () => void;
    index: () => void;
    close: () => void;
    scroll: () => void;
    print: () => void;
    openPdf?: () => void;
  },
) {
  const element = document.createElement("header");
  element.className = "toolbar";
  element.innerHTML = `<div class="toolbar-line" role="toolbar"><div class="toolbar-controls"></div><button class="more-options" type="button" aria-expanded="false" aria-controls="reader-overflow">${icon("more")}</button></div><progress value="0" max="100"></progress><section id="reader-overflow" class="overflow-panel" role="region" hidden><div class="overflow-content"></div></section><div class="choice-popover" role="menu" hidden></div><div class="reader-tooltip" role="tooltip" id="reader-tooltip" hidden></div>`;
  const line = element.querySelector<HTMLElement>(".toolbar-line")!;
  const main = element.querySelector<HTMLElement>(".toolbar-controls")!;
  const more = element.querySelector<HTMLButtonElement>(".more-options")!;
  const panel = element.querySelector<HTMLElement>(".overflow-panel")!;
  const overflow = element.querySelector<HTMLElement>(".overflow-content")!;
  const menu = element.querySelector<HTMLElement>(".choice-popover")!;
  const tooltip = element.querySelector<HTMLElement>(".reader-tooltip")!;
  const progress = element.querySelector<HTMLProgressElement>("progress")!;
  line.setAttribute("aria-label", ui.toolbar);
  panel.setAttribute("aria-label", ui.more);
  progress.setAttribute("aria-label", ui.progress);
  const groups: Group[] = [];
  const updates: (() => void)[] = [];
  let choiceTrigger: HTMLButtonElement | null = null;
  let frame: number | null = null;
  let disposed = false;
  let scrolling = false;
  const focused = () => (element.getRootNode() instanceof ShadowRoot ? ((element.getRootNode() as ShadowRoot).activeElement as HTMLElement | null) : null);
  const visibleButtons = () => [...line.querySelectorAll<HTMLButtonElement>("button")].filter((button) => button.getClientRects().length > 0);
  const rove = (current?: HTMLElement | null) => {
    const buttons = visibleButtons();
    const active = buttons.find((b) => b === current) ?? buttons.find((b) => b.tabIndex === 0) ?? buttons[0];
    buttons.forEach((b) => (b.tabIndex = b === active ? 0 : -1));
  };
  const showTooltip = (target: HTMLElement) => {
    const label = target.dataset.tooltip;
    if (!label || !menu.hidden || overflow.contains(target)) return;
    tooltip.textContent = label;
    tooltip.hidden = false;
    const box = target.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(window.innerWidth - bounds.width - 8, box.x + box.width / 2 - bounds.width / 2))}px`;
    tooltip.style.top = `${Math.min(window.innerHeight - bounds.height - 8, box.bottom + 8)}px`;
    target.setAttribute("aria-describedby", tooltip.id);
  };
  const hideTooltip = () => {
    tooltip.hidden = true;
    element.querySelectorAll('[aria-describedby="reader-tooltip"]').forEach((node) => node.removeAttribute("aria-describedby"));
  };
  const labelButton = (button: HTMLButtonElement, label: string, hint = label) => {
    button.setAttribute("aria-label", label);
    button.dataset.tooltip = hint;
  };
  const button = (label: string, content: string, action: () => void) => {
    const node = document.createElement("button");
    node.type = "button";
    labelButton(node, label);
    node.innerHTML = content;
    node.addEventListener("click", action);
    return node;
  };
  const closeMenu = (restoreFocus = true) => {
    if (menu.hidden) return false;
    menu.hidden = true;
    choiceTrigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus) choiceTrigger?.focus({ preventScroll: true });
    choiceTrigger = null;
    return true;
  };
  const closePanel = (restoreFocus = true) => {
    if (panel.hidden) return false;
    panel.hidden = true;
    more.setAttribute("aria-expanded", "false");
    if (restoreFocus) more.focus({ preventScroll: true });
    return true;
  };
  const closePopovers = () => {
    hideTooltip();
    return closeMenu() || closePanel();
  };
  const addGroup = (key: string) => {
    const node = document.createElement("div");
    node.className = `control-group ${key}-group`;
    node.dataset.control = key;
    const group: Group = { key, element: node };
    groups.push(group);
    main.append(node);
    return group;
  };
  const indexButton = button(ui.index, icon("index"), callbacks.index);
  indexButton.setAttribute("aria-expanded", "false");
  indexButton.setAttribute("aria-controls", "reader-index");
  line.prepend(indexButton);
  const closeButton = button(ui.close, icon("close"), callbacks.close);
  closeButton.className = "close-reader";
  line.append(closeButton);
  labelButton(more, ui.more);
  const choice = (key: "theme" | "font" | "alignment", label: string, triggerLabel: string, items: Choice[]) => {
    const group = addGroup(key);
    group.element.classList.add("choice-group");
    const preview = document.createElement("div");
    preview.className = `${key}-preview choice-preview`;
    const trigger = button(triggerLabel, `<span class="choice-current" aria-hidden="true"></span>${icon("chevron")}`, () => {
      if (choiceTrigger === trigger && !menu.hidden) {
        closeMenu();
        return;
      }
      closeMenu(false);
      closePanel(false);
      hideTooltip();
      choiceTrigger = trigger;
      trigger.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-label", label);
      menu.replaceChildren();
      items.forEach((item) => {
        const option = button(item.label, "", () => {
          preferences[key] = item.value as never;
          callbacks.change();
          closeMenu();
        });
        option.textContent = item.label;
        option.setAttribute("role", "menuitemradio");
        option.setAttribute("aria-checked", String(preferences[key] === item.value));
        option.tabIndex = -1;
        if (item.family) option.style.fontFamily = `"${item.family}", serif`;
        menu.append(option);
      });
      menu.hidden = false;
      const rect = trigger.getBoundingClientRect();
      const bounds = menu.getBoundingClientRect();
      menu.style.left = `${Math.max(8, Math.min(window.innerWidth - bounds.width - 8, rect.left))}px`;
      menu.style.top = `${Math.max(8, Math.min(window.innerHeight - bounds.height - 8, rect.bottom + 8))}px`;
      (menu.querySelector<HTMLButtonElement>('[aria-checked="true"]') ?? menu.querySelector<HTMLButtonElement>("button"))?.focus({ preventScroll: true });
    });
    trigger.className = "choice-trigger";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    const nativeLabel = document.createElement("label");
    nativeLabel.className = "choice-native";
    nativeLabel.append(document.createTextNode(label));
    const select = document.createElement("select");
    select.setAttribute("aria-label", label);
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.append(option);
    });
    select.addEventListener("change", () => {
      preferences[key] = select.value as never;
      callbacks.change();
    });
    nativeLabel.append(select);
    items.forEach((item) => {
      const option = button(item.accessible, item.preview, () => {
        preferences[key] = item.value as never;
        callbacks.change();
      });
      if (item.family) option.style.fontFamily = `"${item.family}", serif`;
      labelButton(option, item.accessible, item.label);
      option.dataset.choice = item.value;
      preview.append(option);
    });
    group.element.append(preview, trigger, nativeLabel);
    updates.push(() => {
      preview
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((node) => node.setAttribute("aria-pressed", String(node.dataset.choice === preferences[key])));
      select.value = preferences[key];
      const current = items.find((item) => item.value === preferences[key])!;
      const sample = trigger.querySelector<HTMLElement>(".choice-current")!;
      sample.innerHTML = current.preview;
      if (current.family) sample.style.fontFamily = `"${current.family}", serif`;
    });
  };
  const themes: ReaderPreferences["theme"][] = ["light", "sepia", "dark", "black", "auto"];
  choice(
    "theme",
    ui.theme,
    ui.chooseTheme,
    themes.map((value, i) => ({
      value,
      label: ui.themes[i]!,
      accessible: `${ui.theme} ${ui.themes[i]}`,
      preview: `<span class="theme-swatch" data-swatch="${value}" aria-hidden="true"></span>`,
    })),
  );
  const fonts: ReaderPreferences["font"][] = ["Georgia", "Literata", "Atkinson Hyperlegible Next", "Lexend"];
  choice(
    "font",
    ui.font,
    ui.chooseFont,
    fonts.map((value) => ({ value, label: value, accessible: `${ui.font} ${value}`, preview: "Aa", family: value })),
  );
  const size = addGroup("size");
  size.element.innerHTML = '<span class="size-heading"><span class="size-label"></span> <output class="font-size"></output></span>';
  size.element.querySelector(".size-label")!.textContent = ui.size;
  size.element.append(
    button(ui.decrease, "A−", () => {
      preferences.fontSize = Math.max(14, preferences.fontSize - 2);
      callbacks.change();
    }),
    button(ui.increase, "A+", () => {
      preferences.fontSize = Math.min(32, preferences.fontSize + 2);
      callbacks.change();
    }),
  );
  const slider = (key: "widthPercent" | "lineHeight" | "speed", label: string, min: number, max: number, step: number, parent: HTMLElement) => {
    const wrapper = document.createElement("label");
    wrapper.append(document.createTextNode(label));
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.setAttribute("aria-label", label);
    wrapper.append(input);
    const output = document.createElement("output");
    output.setAttribute("aria-hidden", "true");
    wrapper.append(output);
    parent.append(wrapper);
    input.addEventListener("input", () => {
      preferences[key] = Number(input.value);
      if (key === "widthPercent") preferences.widthMode = preferences.widthPercent === 100 ? "full" : "custom";
      callbacks.change();
    });
    updates.push(() => {
      const value = preferences[key] || (key === "widthPercent" ? 100 : min);
      input.value = String(value);
      const formatted = key === "widthPercent" ? `${value}%` : key === "lineHeight" ? new Intl.NumberFormat(preferences.language).format(value) : String(value);
      output.textContent = formatted;
      input.setAttribute("aria-valuetext", formatted);
      input.setAttribute("aria-valuenow", String(value));
    });
    return { input, output };
  };
  const width = slider("widthPercent", ui.width, 30, 100, 5, addGroup("width").element);
  width.output.className = "width-value";
  slider("lineHeight", ui.line, 1.2, 2.2, 0.05, addGroup("line").element);
  choice("alignment", ui.align, ui.chooseAlignment, [
    { value: "left", label: ui.left, accessible: ui.alignLeft, preview: icon("left") },
    { value: "center", label: ui.center, accessible: ui.alignCenter, preview: icon("center") },
    { value: "right", label: ui.right, accessible: ui.alignRight, preview: icon("right") },
    { value: "justify", label: ui.justify, accessible: ui.alignJustify, preview: icon("justify") },
  ]);
  const scroll = addGroup("scroll");
  const scrollButton = button(ui.start, `${icon("play")}<span class="overflow-label"></span>`, callbacks.scroll);
  scroll.element.append(scrollButton);
  const speed = slider("speed", ui.speed, 1, 10, 1, scroll.element);
  const print = addGroup("print");
  print.element.append(button(ui.print, `${icon("print")}<span class="overflow-label"></span>`, callbacks.print));
  print.element.querySelector(".overflow-label")!.textContent = ui.print;
  if (callbacks.openPdf) {
    const pdf = addGroup("pdf");
    const open = button(ui.openPdf, "PDF", callbacks.openPdf);
    pdf.element.append(open);
  }
  const info = addGroup("info");
  info.element.classList.add("reading-info");
  const readingTime = document.createElement("span");
  readingTime.className = "reading-time";
  const remaining = document.createElement("span");
  remaining.className = "remaining-time";
  remaining.setAttribute("aria-live", "polite");
  info.element.append(readingTime, remaining);
  let fittedWidth = -1;
  const fit = () => {
    if (disposed || !element.isConnected || !line.clientWidth) return;
    if (fittedWidth === line.clientWidth && main.scrollWidth <= main.clientWidth + 1) return;
    fittedWidth = line.clientWidth;
    const active = focused();
    closeMenu(false);
    hideTooltip();
    groups.forEach((group) => {
      main.append(group.element);
      group.element.classList.remove("compact");
    });
    const move = (key: string) => {
      const group = groups.find((group) => group.key === key);
      if (group) overflow.append(group.element);
    };
    move("info");
    move("pdf");
    const gap = parseFloat(getComputedStyle(main).columnGap) || 0;
    const required = () => {
      const nodes = [...main.children] as HTMLElement[];
      return nodes.reduce((total, node) => total + node.getBoundingClientRect().width, 0) + Math.max(0, nodes.length - 1) * gap;
    };
    if (required() > main.clientWidth) {
      move("width");
      move("line");
      move("scroll");
    }
    for (const key of ["font", "alignment", "theme"]) {
      if (required() <= main.clientWidth) break;
      groups.find((g) => g.key === key)!.element.classList.add("compact");
    }
    for (const key of ["print", "size", "alignment", "font", "theme"]) {
      if (required() <= main.clientWidth) break;
      move(key);
    }
    const order = new Map(groups.map((group, i) => [group.element, i]));
    [...overflow.children].sort((a, b) => order.get(a as HTMLElement)! - order.get(b as HTMLElement)!).forEach((node) => overflow.append(node));
    if (active && element.contains(active)) {
      if (panel.hidden && overflow.contains(active)) more.focus({ preventScroll: true });
      else if (active.getClientRects().length) active.focus({ preventScroll: true });
      else more.focus({ preventScroll: true });
    }
    overflow.querySelectorAll<HTMLButtonElement>("button").forEach((button) => (button.tabIndex = 0));
    rove(focused());
  };
  const schedule = () => {
    if (disposed || frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      fit();
    });
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(line);
  void document.fonts.ready.then(() => {
    if (!disposed) schedule();
  });
  more.addEventListener("click", () => {
    closeMenu(false);
    hideTooltip();
    if (!panel.hidden) {
      closePanel();
      return;
    }
    panel.hidden = false;
    more.setAttribute("aria-expanded", "true");
    panel.querySelector<HTMLElement>("select, input, button")?.focus({ preventScroll: true });
  });
  menu.addEventListener("keydown", (event) => {
    const options = [...menu.querySelectorAll<HTMLButtonElement>("button")];
    const current = options.indexOf(focused() as HTMLButtonElement);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % options.length;
    else if (event.key === "ArrowUp") next = (current - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      return;
    } else if (event.key === "Tab") {
      closeMenu(false);
      return;
    } else return;
    event.preventDefault();
    options[next]?.focus();
  });
  line.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    if (event.key === "ArrowDown" && event.target.getAttribute("aria-haspopup") === "menu") {
      event.preventDefault();
      event.target.click();
      return;
    }
    const buttons = visibleButtons();
    const current = buttons.indexOf(event.target);
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % buttons.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else return;
    event.preventDefault();
    rove(buttons[next]);
    buttons[next]?.focus();
  });
  line.addEventListener("focusin", (event) => {
    if (event.target instanceof HTMLButtonElement) rove(event.target);
  });
  element.addEventListener("pointerover", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tooltip]") : null;
    if (target) showTooltip(target);
  });
  element.addEventListener("pointerout", hideTooltip);
  element.addEventListener("focusin", (event) => {
    if (event.target instanceof HTMLElement) showTooltip(event.target);
  });
  element.addEventListener("focusout", hideTooltip);
  const outside = (event: PointerEvent) => {
    if (!event.composedPath().includes(element)) {
      closeMenu(false);
      closePanel(false);
      hideTooltip();
    }
  };
  document.addEventListener("pointerdown", outside);
  const update = () => {
    updates.forEach((fn) => fn());
    element.querySelector(".font-size")!.textContent = String(preferences.fontSize);
    labelButton(scrollButton, scrolling ? ui.pause : ui.start);
    scrollButton.setAttribute("aria-pressed", String(scrolling));
    scrollButton.querySelector("svg")!.outerHTML = icon(scrolling ? "pause" : "play");
    scrollButton.querySelector(".overflow-label")!.textContent = scrolling ? ui.pause : ui.start;
  };
  update();
  return {
    element,
    indexButton,
    closeButton,
    progress,
    remaining,
    readingTime,
    speedInput: speed.input,
    fit,
    update,
    closePopovers,
    setScrolling: (value: boolean) => {
      scrolling = value;
      update();
    },
    destroy: () => {
      disposed = true;
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", outside);
      hideTooltip();
    },
  };
}
