<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Verification commands

- **Typecheck:** `npx tsc --noEmit`
- **Build:** `npm run build` (vite build → nitro, Cloudflare preset)
- **Lint:** `npm run lint` (eslint + prettier; project-wide CRLF `Delete ␍` errors are pre-existing — files use CRLF but prettier expects LF; not a blocker)
- **Dev:** `npm run dev`

## Architecture notes

- Mobile-first single-page app inside `PhoneFrame`. Premium minimalism, Clarity City font, `--primary` = `--theme-accent`.
- z-index layering: `BottomNav` z-50 < `ActiveWaitlistWidget` z-[60] < sheets (`RestaurantSheet`, `VenueBookingModal`) z-[100] < `JoinWaitlistSheet` z-[120] < `SpotAvailableOverlay` z-[130].
- Waitlist system: `WaitlistProvider` (context) + `JoinWaitlistSheet` / `WaitlistButton` / `MyQueuesSection` / `ActiveWaitlistWidget` / `SpotAvailableOverlay`. Generic across venue types via `JoinWaitlistInput`.
- shadcn/ui components live in `src/components/ui/*` (Radix-based). `Accordion` animations come from `tw-animate-css`.
- Restaurant data + lifestyle venues in `src/data/hostess.ts`. Unsplash images via `img(id, w)` helper.
- Floating bottom CTAs use `bottom-[calc(80px+env(safe-area-inset-bottom)+16px)]` (80px ≈ BottomNav height + safe-area + 16px gap). Scrollable content inside sheets/screens uses `pb-[calc(80px+env(safe-area-inset-bottom)+16px)]` (or larger if CTA is floating) and `overscroll-none` to avoid body scroll chaining.
- Hero parallax: sticky `top-0` hero images with `motion.img` `scale`/`opacity` tied to `useScroll({ container: scrollRef })` and a `bg-gradient-to-t from-background` overlay to blend content into the photo.

