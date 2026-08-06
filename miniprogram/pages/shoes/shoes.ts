import type { Shoe } from '../../models/shoe'
import { deleteShoeFromApi, listShoesFromApi } from '../../services/shoe-api-service'

interface ShoeView extends Shoe {
  statusLabel: string
  statusClass: string
  metaText: string
}

interface ShoesData {
  shoes: Shoe[]
  visibleShoes: ShoeView[]
  touchStartX: number
  touchStartY: number
  openedShoeId: number
  isSwipeAction: boolean
}

const getMetaText = (shoe: Shoe) => {
  const parts = [shoe.size, shoe.colorway].filter(Boolean)

  return parts.length ? parts.join(' · ') : shoe.model || shoe.brand
}

const createShoeView = (shoe: Shoe): ShoeView => {
  return {
    ...shoe,
    statusLabel: shoe.status === 1 ? '主力' : shoe.status === 3 ? '退役' : '在用',
    statusClass: shoe.status === 1 ? 'primary' : shoe.status === 3 ? 'retired' : 'active',
    metaText: getMetaText(shoe),
  }
}

Component({
  data: {
    shoes: [],
    visibleShoes: [],
    touchStartX: 0,
    touchStartY: 0,
    openedShoeId: 0,
    isSwipeAction: false,
  } as ShoesData,
  pageLifetimes: {
    show() {
      this.refreshShoes()
    },
  },
  methods: {
    async refreshShoes() {
      try {
        const shoes = await listShoesFromApi(true)

        this.setData({
          shoes,
          visibleShoes: shoes.map(createShoeView),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    onTouchStart(event: WechatMiniprogram.TouchEvent) {
      const touch = event.touches[0]
      if (!touch) {
        return
      }

      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
      })
    },
    onTouchEnd(event: WechatMiniprogram.TouchEvent) {
      const touch = event.changedTouches[0]
      const id = Number(event.currentTarget.dataset.id) || 0
      if (!touch || !id) {
        return
      }

      const deltaX = touch.clientX - this.data.touchStartX
      const deltaY = touch.clientY - this.data.touchStartY
      if (Math.abs(deltaY) > 50 || Math.abs(deltaX) < 60) {
        return
      }

      this.setData({
        openedShoeId: deltaX < 0 ? id : 0,
        isSwipeAction: true,
      })
    },
    deleteShoe(event: WechatMiniprogram.TouchEvent) {
      const id = Number(event.currentTarget.dataset.id) || 0
      if (!id) {
        return
      }

      wx.showModal({
        title: '删除球鞋',
        content: '删除后不会在列表中显示，历史记录不受影响',
        confirmText: '删除',
        confirmColor: '#d93025',
        success: async (res) => {
          if (!res.confirm) {
            return
          }

          try {
            await deleteShoeFromApi(id)
            wx.showToast({ title: '已删除', icon: 'success' })
            this.setData({ openedShoeId: 0 })
            this.refreshShoes()
          } catch (error) {
            wx.showToast({
              title: error instanceof Error ? error.message : '删除失败',
              icon: 'none',
            })
          }
        },
      })
    },
    goDetail(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as number | undefined

      if (this.data.isSwipeAction) {
        this.setData({
          isSwipeAction: false,
        })
        return
      }

      if (!id || this.data.openedShoeId === id) {
        return
      }

      wx.navigateTo({
        url: `/pages/shoe-detail/shoe-detail?id=${id}`,
      })
    },
    addShoe() {
      wx.navigateTo({
        url: '/pages/shoe-library/shoe-library',
      })
    },
    onShareAppMessage() {
      return {
        title: '我的网球装备',
        path: '/pages/shoes/shoes',
      }
    },
    onShareTimeline() {
      return {
        title: '我的网球装备',
      }
    },
  },
})
