import PlanPageBase from '../components/common/PlanPageBase';
import GtbPlanLegend from "./gtbPlan/Icon/GtbPlanLegend";
import GtbPlanDragArea from './gtbPlan/GtbPlanDragArea';

const Page6 = () => {
  return (
    <PlanPageBase
      pageTitle="Page 6 – Plan GTB"
      planType="GTB"
      LegendComponent={GtbPlanLegend}
      DraggableCardListComponent={GtbPlanDragArea}
    />
  );
};

export default Page6;
