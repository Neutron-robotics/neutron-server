const flow = {
  title: 'Wheeler base',
  type: 'Flow',
  robotId: 'id-to-robotmodel',
  partId: 'id-to-partModel',

  nodes: [
    {
      width: 97,
      height: 208,
      id: '30f0f93a-f757-4ca0-938d-9cfd729f604e',
      type: 'publisherNode',
      position: {
        x: 994,
        y: 190
      },
      preview: false,
      publisherId: '650ed2d0349c25d66ce010f5',
      title: 'test pub',
      selected: false,
      positionAbsolute: {
        x: 994,
        y: 190
      },
      dragging: false
    },
    {
      width: 60,
      height: 60,
      id: '483415fd-2146-4e19-83b4-6aabdd0aa1a7',
      type: 'ifNode',
      position: {
        x: 524,
        y: 304
      },
      preview: false,
      data: {},
      title: 'If',
      selected: false,
      positionAbsolute: {
        x: 524,
        y: 304
      },
      dragging: false
    },
    {
      width: 60,
      height: 60,
      id: '1f2db470-9a64-4c6f-88b6-571b2d6604ca',
      type: 'ifNode',
      position: {
        x: 533,
        y: 220
      },
      preview: false,
      data: {},
      title: 'If',
      selected: false,
      positionAbsolute: {
        x: 533,
        y: 220
      },
      dragging: false
    },
    {
      width: 160,
      height: 70,
      id: '1257a4b8-d9a8-4c5b-bd06-e3f7e613b7a2',
      type: 'purcentageNode',
      position: {
        x: 696,
        y: 303
      },
      preview: false,
      data: {},
      title: 'Purcentage',
      selected: true,
      positionAbsolute: {
        x: 696,
        y: 303
      },
      dragging: false
    },
    {
      width: 160,
      height: 70,
      id: '06650bae-0db1-4715-a8bd-208ebfe53c53',
      type: 'purcentageNode',
      position: {
        x: 709,
        y: 191
      },
      preview: false,
      data: {},
      title: 'Purcentage',
      selected: false,
      positionAbsolute: {
        x: 709,
        y: 191
      },
      dragging: false
    },
    {
      width: 351,
      height: 180,
      id: 'e02a40f2-490f-438e-832e-e5ad789bccfd',
      type: 'baseController',
      position: {
        x: 77,
        y: 210
      },
      preview: false,
      data: {
        preview: true
      },
      canBeInput: true,
      title: 'Base Controller',
      selected: false,
      positionAbsolute: {
        x: 77,
        y: 210
      },
      dragging: false
    }
  ],
  edges: [
    {
      source: 'e02a40f2-490f-438e-832e-e5ad789bccfd',
      sourceHandle: 'top',
      target: '1f2db470-9a64-4c6f-88b6-571b2d6604ca',
      targetHandle: 'nodeInput',
      id: 'reactflow__edge-e02a40f2-490f-438e-832e-e5ad789bccfdtop-1f2db470-9a64-4c6f-88b6-571b2d6604canodeInput'
    },
    {
      source: '1f2db470-9a64-4c6f-88b6-571b2d6604ca',
      sourceHandle: 'nodeOutput',
      target: '06650bae-0db1-4715-a8bd-208ebfe53c53',
      targetHandle: 'nodeInput',
      id: 'reactflow__edge-1f2db470-9a64-4c6f-88b6-571b2d6604canodeOutput-06650bae-0db1-4715-a8bd-208ebfe53c53nodeInput'
    },
    {
      source: '483415fd-2146-4e19-83b4-6aabdd0aa1a7',
      sourceHandle: 'nodeOutput',
      target: '1257a4b8-d9a8-4c5b-bd06-e3f7e613b7a2',
      targetHandle: 'nodeInput',
      id: 'reactflow__edge-483415fd-2146-4e19-83b4-6aabdd0aa1a7nodeOutput-1257a4b8-d9a8-4c5b-bd06-e3f7e613b7a2nodeInput'
    },
    {
      source: '1257a4b8-d9a8-4c5b-bd06-e3f7e613b7a2',
      sourceHandle: 'nodeOutput',
      target: '30f0f93a-f757-4ca0-938d-9cfd729f604e',
      targetHandle: 'x',
      id: 'reactflow__edge-1257a4b8-d9a8-4c5b-bd06-e3f7e613b7a2nodeOutput-30f0f93a-f757-4ca0-938d-9cfd729f604ex'
    },
    {
      source: 'e02a40f2-490f-438e-832e-e5ad789bccfd',
      sourceHandle: 'bottom',
      target: '483415fd-2146-4e19-83b4-6aabdd0aa1a7',
      targetHandle: 'nodeInput',
      id: 'reactflow__edge-e02a40f2-490f-438e-832e-e5ad789bccfdbottom-483415fd-2146-4e19-83b4-6aabdd0aa1a7nodeInput'
    },
    {
      source: '06650bae-0db1-4715-a8bd-208ebfe53c53',
      sourceHandle: 'nodeOutput',
      target: '30f0f93a-f757-4ca0-938d-9cfd729f604e',
      targetHandle: 'x',
      id: 'reactflow__edge-06650bae-0db1-4715-a8bd-208ebfe53c53nodeOutput-30f0f93a-f757-4ca0-938d-9cfd729f604ex'
    }
  ]
};

const connector = {
  ...flow,
  type: 'Connector'
};

export {
  flow,
  connector
};
