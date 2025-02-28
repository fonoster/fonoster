import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { TrunkDTO } from "@/types/dto";
import { useQueryData } from "@/common/contexts/table/QueryData";

const QueryTrunks = () => {
    const { listTrunks } = useTrunks();

    // Using the new reusable hook
    useQueryData<TrunkDTO>({
        fetchFunction: listTrunks,
        pageSize: 10
    });

    return null;
};

export default QueryTrunks;