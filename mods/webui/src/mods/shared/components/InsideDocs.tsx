import { Transition } from '@headlessui/react'
import { Fragment, useCallback } from 'react'

import { Text, Title } from '@/ui'

import { CodeBlock } from './CodeBlock'

interface InsideDocsProps {
  title: string
  content: string
  description: string
  show: boolean
  tableContent?: {
    headers: string[]
    rows: string[][]
  }
}

export const InsideDocs: React.FC<InsideDocsProps> = ({
  title,
  description,
  content,
  tableContent,
  show,
}) => {
  const getCell = useCallback((cell: string) => {
    const [name, kind] = cell.split(':')

    return kind ? (
      <span className="text-white">
        {name}: <strong className="text-primary">{kind}</strong>
      </span>
    ) : (
      name
    )
  }, [])

  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-500"
      enterFrom="transform opacity-0 translate-x-96"
      enterTo="transform opacity-100 translate-x-0"
      leave="transition ease-in duration-300"
      leaveFrom="transform opacity-100 translate-x-0"
      leaveTo="transform opacity-0 translate-x-96"
      show={show}
    >
      <aside
        className="sdk-docs hidden p-6 max-w-[24rem] 2xl:max-w-[29rem] overflow-x-hidden overflow-y-auto lg:block border-l"
        style={{ background: '#2E3138', borderColor: '#4F5358' }}
      >
        <Title level={3} className="mb-6">
          {title}
        </Title>

        <Text className="mb-6">{description}</Text>

        <CodeBlock lang="js">{content.trim()}</CodeBlock>

        {tableContent && (
          <table className="w-full table-auto border-collapse rounded">
            <thead className="bg-gray-800">
              <tr>
                {tableContent.headers.map(header => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-6 text-left uppercase text-xs font-medium text-white tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableContent.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-gray-600' : 'bg-gray-500'}
                >
                  {row.map((cell, idx) => (
                    <td key={idx} className="px-6 py-4 text-gray-200">
                      {getCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </aside>
    </Transition>
  )
}
