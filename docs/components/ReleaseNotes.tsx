import { useData } from "nextra/data"
import dynamic from "next/dynamic"

function ReleaseNote(props: { filename: string }) {
  const Content = dynamic(() => import(`../releases/${props.filename}`))

  return (
    <Content />
  )
}

export function ReleaseNotes() {
  const { releases } = useData() as { releases: Array<{ filename: string }>}

  return (
    <>
      { releases.map((release, index) => <ReleaseNote key={index} filename={release.filename} />) }
    </>
  )
}