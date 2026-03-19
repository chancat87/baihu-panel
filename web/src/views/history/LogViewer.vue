<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-vue-next'
import LogTerminal from '@/components/LogTerminal.vue'
import { useTheme } from '@/composables/useTheme'
import { api } from '@/api'
// import { toast } from 'vue-sonner' // redundant here
import { TASK_STATUS } from '@/constants'

const { resolvedTheme } = useTheme()

const props = defineProps<{
  open: boolean
  logId?: string
  taskName?: string
  initialStatus?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const logContent = ref('')
const logStatus = ref(props.initialStatus || '')
const isWsLoading = ref(false)
let logSocket: WebSocket | null = null
let durationTimer: ReturnType<typeof setInterval> | null = null

const lightLogBackgroundClass = 'bg-zinc-100'
const darkLogBackgroundClass = 'bg-zinc-950'

function close() {
  emit('update:open', false)
}

function connectLogSocket(id: string) {
  if (logSocket) {
    logSocket.close()
  }
  isWsLoading.value = true
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const baseUrl = (window as any).__BASE_URL__ || ''
  const apiVersion = (window as any).__API_VERSION__ || '/api/v1'
  const wsUrl = `${protocol}//${host}${baseUrl}${apiVersion}/logs/ws?log_id=${id}`

  logSocket = new WebSocket(wsUrl)

  logSocket.onopen = () => {
    isWsLoading.value = false
    logContent.value = ''
  }

  logSocket.onmessage = (event) => {
    if (logStatus.value !== TASK_STATUS.RUNNING) {
      logContent.value = event.data
    } else {
      logContent.value += event.data
    }
  }

  logSocket.onerror = () => {
    isWsLoading.value = false
    logContent.value = '日志连接异常'
  }

  logSocket.onclose = () => {
    isWsLoading.value = false
  }
}

function startPolling(id: string) {
  if (durationTimer) clearInterval(durationTimer)
  durationTimer = setInterval(async () => {
    try {
      if (!props.open) {
        if (durationTimer) clearInterval(durationTimer)
        return
      }
      const logRes = await api.logs.get(id)
      if (logRes) {
        logStatus.value = logRes.status
        if (logRes.status !== TASK_STATUS.RUNNING) {
          if (durationTimer) clearInterval(durationTimer)
        }
      }
    } catch { /* ignore */ }
  }, 3000)
}

watch(() => props.open, (val) => {
  if (val && props.logId) {
    logStatus.value = props.initialStatus || ''
    connectLogSocket(props.logId)
    if (logStatus.value === TASK_STATUS.RUNNING) {
      startPolling(props.logId)
    }
    document.body.style.overflow = 'hidden'
  } else {
    if (logSocket) {
      logSocket.close()
      logSocket = null
    }
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  if (logSocket) logSocket.close()
  if (durationTimer) clearInterval(durationTimer)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
      @click.self="close">
      <div
        class="bg-background rounded-lg shadow-lg flex flex-col w-full sm:w-[90vw] md:w-[80vw] max-w-5xl h-[90vh] sm:h-[85vh]">
        <div class="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b shrink-0 gap-3">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="text-sm font-medium truncate">最新日志 - {{ taskName }}</span>
            <div v-if="logStatus"
              class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors shrink-0"
              :class="logStatus === TASK_STATUS.SUCCESS ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                logStatus === TASK_STATUS.FAILED ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'">
              <span v-if="logStatus === TASK_STATUS.RUNNING" class="relative flex h-1.5 w-1.5 mr-0.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
              </span>
              {{ logStatus === TASK_STATUS.SUCCESS ? '成功' : logStatus === TASK_STATUS.FAILED ? '失败' : '执行中' }}
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" class="h-8 w-8 sm:h-7 sm:w-7" @click="close">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div class="flex-1 overflow-hidden relative"
          :class="resolvedTheme === 'dark' ? darkLogBackgroundClass : lightLogBackgroundClass">
          <LogTerminal v-if="logContent" :content="logContent" :theme="resolvedTheme" />
          <div v-else-if="isWsLoading" class="absolute inset-0 flex items-center justify-center gap-2 text-zinc-500 font-mono text-sm">
            <Loader2 class="h-4 w-4 animate-spin" />
            连接中...
          </div>
          <div v-else class="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-sm italic">
            无日志输出
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
