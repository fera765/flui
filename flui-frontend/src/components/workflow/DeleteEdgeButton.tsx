import { EdgeProps, getBezierPath } from 'reactflow';
import { X } from 'lucide-react';

export function DeleteEdgeButton({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent, id: string) => {
    evt.stopPropagation();
    if (data?.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={40}
        height={40}
        x={labelX - 20}
        y={labelY - 20}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <button
            className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-background"
            onClick={(event) => onEdgeClick(event, id)}
            title="Desconectar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </foreignObject>
    </>
  );
}
