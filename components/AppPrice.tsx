import { PricingType } from '@/types/listing.types';
import { formatMoney } from '@/utils/money.utils';

interface AppPriceProps {
  amount: number;
  currency: string;
  pricingType?: PricingType;
}

export default function AppPrice({
  amount,
  currency,
  pricingType,
}: AppPriceProps) {
  return (
    <p className="b1-m shrink-0 text-text tabular-nums">
      {formatMoney(amount, currency)}
      {pricingType === 'hourly' ? (
        <span className="b2-r text-text-light"> / hour</span>
      ) : null}
    </p>
  );
}
