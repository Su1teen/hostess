import { DiningAccount } from "./DiningAccount";
/** All balances and expiry lots come from the server session's wallet. */
export function WalletStack() {
  return (
    <div className="px-5">
      <DiningAccount showIdentity={false} />
    </div>
  );
}
