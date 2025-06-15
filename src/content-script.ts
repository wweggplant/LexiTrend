// LexiTrend Content Script for Google Trends
console.log('LexiTrend Content Script loaded.');

/**
 * Limits how often a function can run.
 * @param func The function to debounce.
 * @param waitFor The delay in milliseconds.
 */
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

/**
 * Main execution function for the content script.
 */
function main() {
  if (window.location.hostname !== 'trends.google.com') return;
  console.log('LexiTrend is active on Google Trends.');

  const LEXITREND_BUTTON_CLASS = 'lexitrend-analyze-button';
  const LEXITREND_TAGGED_ATTR = 'data-lexitrend-tagged';
  const SHADOW_HOST_SELECTORS = 'related-queries, related-topics';

  /**
   * Scans for keywords in the main document and within any Shadow DOM hosts.
   */
  const findAndTagKeywords = () => {
    const searchContexts: (Document | ShadowRoot)[] = [document];
    document.querySelectorAll(SHADOW_HOST_SELECTORS).forEach(host => {
      if (host.shadowRoot) {
        searchContexts.push(host.shadowRoot);
      }
    });

    const keywordSelectors = [
      '.p_a .label-line-clamp', '.label-line-clamp', '.item-title', 
      'a.feed-item-header-title', 'div.label-text'
    ];
    const query = keywordSelectors.map(s => `${s}:not([${LEXITREND_TAGGED_ATTR}])`).join(', ');

    for (const context of searchContexts) {
      context.querySelectorAll<HTMLElement>(query).forEach(element => {
        const keyword = element.textContent?.trim();
        if (keyword && keyword.length > 1) {
          element.setAttribute(LEXITREND_TAGGED_ATTR, 'true');
          addAnalyzeButton(element);
        }
      });
    }
  };

  /**
   * Adds an "Analyze" button near the target keyword element.
   * @param targetElement The element containing the keyword text.
   */
  const addAnalyzeButton = (targetElement: HTMLElement) => {
    const container = targetElement.closest<HTMLElement>('.item, .p_a');
    if (!container || container.querySelector(`.${LEXITREND_BUTTON_CLASS}`)) return;

    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    const button = document.createElement('button');
    button.innerHTML = '✨ Analyze';
    button.className = LEXITREND_BUTTON_CLASS;

    Object.assign(button.style, {
      position: 'absolute', top: '50%', right: '50px',
      transform: 'translateY(-50%)', opacity: '0', visibility: 'hidden',
      transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
      zIndex: '2000', padding: '4px 8px', fontSize: '12px', border: '1px solid #dadce0',
      borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
    });

    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const keywordElement = container.querySelector<HTMLElement>('.label-text, .label-line-clamp, .item-title, .b_b');
      const keyword = keywordElement?.textContent?.trim();
      if (keyword) {
        chrome.runtime.sendMessage({ type: 'ANALYZE_KEYWORD', payload: { keyword } });
      } else {
        console.error('LexiTrend: Could not find keyword text on click.');
      }
    });

    container.appendChild(button);
    container.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.visibility = 'visible';
    });
    container.addEventListener('mouseleave', () => {
      button.style.opacity = '0';
      button.style.visibility = 'hidden';
    });
  };

  const debouncedScan = debounce(findAndTagKeywords, 500);

  const observer = new MutationObserver(() => {
    debouncedScan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan in case the content is already present.
  debouncedScan();
}

// Run the main function of the content script.
main(); 