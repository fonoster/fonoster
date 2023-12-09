import dynamic from 'next/dynamic'

const View = dynamic(() => import('react-json-view'), { ssr: false })

export const Json: React.FC<{
  data: Record<string, unknown>
  bg?: string
}> = ({ data, bg = '#27292f' }) => (
  <View
    src={data}
    enableClipboard={false}
    displayDataTypes={false}
    collapsed={true}
    iconStyle="square"
    theme={{
      base00: bg,
      base01: '#bbbbbb',
      base02: '#9fe9ce',
      base03: '#bbbbbb',
      base04: '#4ab96d',
      base05: '#bbbbbb',
      base06: '#bbbbbb',
      base07: '#bbbbbb',
      base08: '#bbbbbb',
      base09: '#ffffff',
      base0A: '#4ab96d',
      base0B: '#4ab96d',
      base0C: '#4ab96d',
      base0D: '#4ab96d',
      base0E: '#4ab96d',
      base0F: '#4ab96d',
    }}
  />
)
