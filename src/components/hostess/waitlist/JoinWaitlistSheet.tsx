import { createPortal } from "react-dom";
import { hapticSelect } from "@/lib/haptics";
import { BottomSheet, Button, Photo } from "../system";
import type { JoinWaitlistInput } from "./types";

/**
 * Waitlist confirmation. Portaled to <body> so it can be opened from docked
 * bars and nested sheets without being clipped.
 */
export function JoinWaitlistSheet({
  input,
  onClose,
  onConfirm,
}: {
  input: JoinWaitlistInput;
  onClose: () => void;
  onConfirm: (input: JoinWaitlistInput) => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <BottomSheet
      onClose={onClose}
      z="z-[160]"
      maxHeight="80%"
      footer={
        <Button
          block
          size="lg"
          onClick={() => {
            hapticSelect();
            onConfirm(input);
          }}
        >
          Встать в лист ожидания
        </Button>
      }
    >
      <div className="px-5 pb-6 pt-8">
        <div className="flex items-center gap-3.5">
          {input.cover && <Photo src={input.cover} className="h-14 w-14 shrink-0 rounded-[16px]" />}
          <div className="min-w-0">
            <p className="t-micro">Лист ожидания</p>
            <p className="mt-1 truncate text-[18px] font-semibold tracking-[-0.02em]">{input.entityName}</p>
            {input.resource && <p className="truncate text-[13px] text-ink-2">{input.resource}</p>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 divide-x divide-line border-y border-line py-4">
          <div className="pr-4">
            <p className="t-micro">Ожидание</p>
            <p className="t-num mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em]">
              ~{input.etaMin}
              <span className="ml-1 text-[14px] font-medium text-ink-2">мин</span>
            </p>
          </div>
          <div className="pl-4">
            <p className="t-micro">Перед вами</p>
            <p className="t-num mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em]">
              {input.peopleAhead}
              <span className="ml-1 text-[14px] font-medium text-ink-2">чел.</span>
            </p>
          </div>
        </div>

        <p className="t-caption mt-4">
          Сообщим, как только освободится место — на подтверждение будет 5 минут. Покинуть очередь
          можно в любой момент.
        </p>
      </div>
    </BottomSheet>,
    document.body,
  );
}
