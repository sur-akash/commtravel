/* =============================================================================
   SearchBox — a destination combobox, shared by the trip flow and the locator.

   Built to the ARIA combobox pattern rather than as a text input with a div
   under it: arrow keys move through the list, Enter picks, Escape closes, and
   the active option is announced through aria-activedescendant. A search box
   you can only use with a mouse is a worse version of a dropdown.
   ============================================================================= */

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './primitives/index.jsx'
import { searchDestinations, describeDestination, isCurrencySupported } from '../data/destinations.js'
import './SearchBox.css'

export default function SearchBox({
  label,
  placeholder = 'Search a city or country',
  value,
  onSelect,
  kinds,
  hint,
  showCurrency = true,
  size = 'md',
}) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [results, setResults] = useState(() => searchDestinations('', { kinds }))
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setResults(searchDestinations(query, { kinds }))
    setActive(0)
  }, [query, kinds])

  // Close when focus or a click leaves the widget entirely.
  useEffect(() => {
    if (!open) return undefined
    const onDocumentDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocumentDown)
    return () => document.removeEventListener('pointerdown', onDocumentDown)
  }, [open])

  const choose = (item) => {
    if (!item) return
    onSelect(item)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (current + direction + results.length) % results.length)
    } else if (event.key === 'Enter') {
      if (open && results[active]) {
        event.preventDefault()
        choose(results[active])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={`search search--${size}`} ref={wrapRef}>
      {label ? (
        <label className="search__label" htmlFor={`${id}-input`}>
          {label}
        </label>
      ) : null}

      <div className="search__field">
        <Icon name="pin" size={18} className="search__icon" />
        <input
          id={`${id}-input`}
          ref={inputRef}
          className="search__input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${id}-opt-${active}` : undefined}
          placeholder={value ? value : placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="search__clear"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      {hint ? <p className="search__hint">{hint}</p> : null}

      {open ? (
        <ul className="search__list" id={`${id}-list`} role="listbox" aria-label="Destinations">
          {results.length === 0 ? (
            <li className="search__empty">No match. Try a city, or the country name.</li>
          ) : (
            results.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={`search__option ${index === active ? 'is-active' : ''}`}
                  // pointerdown, not click: the input's blur would otherwise
                  // close the list before the click lands.
                  onPointerDown={(event) => {
                    event.preventDefault()
                    choose(item)
                  }}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className="search__option-main">
                    <span className="search__option-name">{item.name}</span>
                    <span className="search__option-sub">{describeDestination(item)}</span>
                  </span>
                  {showCurrency && item.currency ? (
                    <span
                      className={`search__option-currency ${
                        isCurrencySupported(item.currency) ? 'is-supported' : ''
                      }`}
                    >
                      {item.currency}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
