import Detail from "src/routes/Detail"
import { filterPosts } from "src/libs/utils/notion"
import { CONFIG } from "site.config"
import { NextPageWithLayout } from "../types"
import CustomError from "src/routes/Error"
import { getPosts } from "src/apis"
import MetaConfig from "src/components/MetaConfig"
import { GetStaticProps } from "next"
import { queryClient } from "src/libs/react-query"
import { queryKey } from "src/constants/queryKey"
import { dehydrate } from "@tanstack/react-query"
import usePostQuery from "src/hooks/usePostQuery"
import { FilterPostsOptions } from "src/libs/utils/notion/filterPosts"

const filter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

export const getStaticPaths = async () => {
  const posts = await getPosts()
  const filteredPost = filterPosts(posts, filter)

  return {
    paths: filteredPost.map((row) => `/${row.slug}`),
    fallback: false, //ture => false
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slugParam = context.params?.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) {
    return { notFound: true }
  }

  const posts = await getPosts()
  const feedPosts = filterPosts(posts)
  await queryClient.prefetchQuery(queryKey.posts(), () => feedPosts)

  const detailPosts = filterPosts(posts, filter)
  const postDetail = detailPosts.find((t: any) => t.slug === slug)

  // ✅ 슬러그에 해당하는 글이 없으면 404
  if (!postDetail) {
    return { notFound: true }
  }

  await queryClient.prefetchQuery(queryKey.post(`${slug}`), () => ({
    ...postDetail
  }))

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    // ❌ ISR 금지: export 모드에서는 revalidate 제거
    // revalidate: CONFIG.revalidateTime,
  }
}


const DetailPage: NextPageWithLayout = () => {
  const post = usePostQuery()

  if (!post) return <CustomError />

  const generatedOgImage = `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(post.title)}.png`
  const image = post.thumbnail || generatedOgImage

  const date = post.date?.start_date || post.createdTime || ""
  const parsedDate = new Date(date)
  const publishedDate = Number.isNaN(parsedDate.getTime())
    ? undefined
    : parsedDate.toISOString()

  const meta = {
    title: post.title,
    date: publishedDate,
    image: image,
    description: post.summary || "",
    type: post.type[0],
    url: `${CONFIG.link}/${post.slug}`,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Detail />
    </>
  )
}

DetailPage.getLayout = (page) => {
  return <>{page}</>
}

export default DetailPage
