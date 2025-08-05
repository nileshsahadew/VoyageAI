import { Chip } from "@mui/material";

function IteneraryPlanner(){
    let tags = [];
    function handleTagSelect(){
        tags.append(null);
    }

    return (
        <div>
            <Chip label='Beach' onClick={handleTagSelect}></Chip>
            <Chip label='Cultural' onClick={handleTagSelect}></Chip>
            <Chip label='Mall' onClick={handleTagSelect}></Chip>
        </div>
    )
}

export default IteneraryPlanner;