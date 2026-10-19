import { ArrowRightLeft, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function ActionButtonGroup() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button data-action-status="missing" variant="primary" className="min-w-[4.5rem]">
        <Icon icon={Plus} size="sm" />
        New
      </Button>
      <Button data-action-status="missing" variant="secondary" className="min-w-[4.5rem]">
        <Icon icon={Square} size="sm" />
        End
      </Button>
      <Button data-action-status="missing" variant="secondary" className="min-w-[4.5rem]">
        <Icon icon={ArrowRightLeft} size="sm" />
        Transfer
      </Button>
    </div>
  );
}
