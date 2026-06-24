import { ArrowRightLeft, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function ActionButtonGroup() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" disabled className="min-w-[4.5rem]">
        <Icon icon={Plus} size="sm" />
        New
      </Button>
      <Button variant="secondary" disabled className="min-w-[4.5rem]">
        <Icon icon={Square} size="sm" />
        End
      </Button>
      <Button variant="secondary" disabled className="min-w-[4.5rem]">
        <Icon icon={ArrowRightLeft} size="sm" />
        Transfer
      </Button>
    </div>
  );
}
