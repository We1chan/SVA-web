import request from '@/utils/request'

export function getDeviceList(query) {
  return request({
    url: `/waring/device/list`,
    method: 'get',
    params: query
  })
}

export function getDevice(apeId) {
  return request({
    url: `/waring/device/${apeId}`,
    method: 'get'
  })
}

export function addDevice(data) {
  return request({
    url: `/waring/device`,
    method: 'post',
    data: data
  })
}

export function updateDevice(data) {
  return request({
    url: `/waring/device`,
    method: 'put',
    data: data
  })
}

export function delDevice(apeIdOrIds) {
  return request({
    url: `/waring/device/${apeIdOrIds}`,
    method: 'delete'
  })
}

export function getLDeviceList(query) {
  return request({
    url: `/waring/device/lixian`,
    method: 'get',
    params: query
  })
}

export function getHistoryWaring(data) {
  return request({
    url: `/waring/waring/getHistoryWaring`,
    method: 'get',
    params: data
  })
}

export async function getMonitorUrl(device_id, token) {
  const url = `http://192.168.101.174:11125/api/vms/v2/webuas/live/stream/url?channel_code=${device_id}&stream_type=0&stream_mode=1&keep_alive=100&visit_ip=192.168.136.246`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token,
      'User': 'usercode:SYCC',
      'Cookie': 'usercode=SYCC',
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  return data
}

export function getDirectLiveUrl(apeId) {
  return request({
    url: `/waring/device/live/direct/${apeId}`,
    method: 'get'
  })
}

export function startDeviceMonitor(apeId) {
  return request({
    url: `/waring/device/monitor/${apeId}/start`,
    method: 'post',
    timeout: 23000
  })
}

export function stopDeviceMonitor(apeId) {
  return request({
    url: `/waring/device/monitor/${apeId}/stop`,
    method: 'post',
    timeout: 23000
  })
}

export function previewDeviceMonitor(apeId) {
  return request({
    url: `/waring/device/monitor/${apeId}/preview`,
    method: 'get'
  })
}

/**
 * 同步 SIP/GB 平台目录为国标业务设备（仅管理员）。
 * 不带目录快照时后端只做安全对账（不新增、不剔除）。
 */
export function syncGb28181Devices(zlmServerId = 1) {
  return request({
    url: `/waring/device/gb28181/catalog/sync`,
    method: 'post',
    params: { zlmServerId },
    timeout: 30000
  })
}

/**
 * 仅按显式媒体绑定刷新 GB28181 设备在线/可播放状态（仅管理员）。
 */
export function refreshGb28181Status(zlmServerId = 1) {
  return request({
    url: `/waring/device/gb28181/status/refresh`,
    method: 'post',
    params: { zlmServerId },
    timeout: 30000
  })
}
