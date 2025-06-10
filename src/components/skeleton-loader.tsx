type SkeletonLoaderProps = {}

export default function SkeletonLoader({}: SkeletonLoaderProps) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 模拟 Tab 切换器 */}
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
        <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
      </div>

      {/* 模拟标题区域 */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-300 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>

      {/* 模拟第二个内容块 */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-300 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>

      {/* 模拟列表项 */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-300 rounded w-1/5"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 模拟标签区域 */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-300 rounded w-1/4"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-6 bg-gray-200 rounded-full w-16"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
