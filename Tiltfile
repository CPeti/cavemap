docker_build(
    'cave-service-image',
    './services/cave-service',
    dockerfile='./services/cave-service/Dockerfile',
    live_update=[
        sync('./services/cave-service', '/app'),
    ]
)

docker_build(
    'user-service-image',
    './services/user-service',
    dockerfile='./services/user-service/Dockerfile',
    live_update=[
        sync('./services/user-service/src', '/usr/src/app'),
    ]
)

docker_build(
    'group-service-image',
    './services/group-service',
    dockerfile='./services/group-service/Dockerfile',
    live_update=[
        sync('./services/group-service', '/app'),
    ]
)

docker_build(
    'media-service-image',
    './services/media-service',
    dockerfile='./services/media-service/Dockerfile',
    live_update=[
        sync('./services/media-service', '/app'),
    ]
)

docker_build(
    'frontend-image',
    './frontend',
    dockerfile='./frontend/Dockerfile.dev',
    live_update=[
        sync('./frontend', '/app'),
    ]
)

k8s_yaml(
    helm(
        './charts',
        values=['./charts/values.yaml'],
        set=[
            'caveService.image=cave-service-image',
            'userService.image=user-service-image',
            'groupService.image=group-service-image',
            'mediaService.image=media-service-image',
            'frontend.image=frontend-image',
        ]
    )
)

k8s_resource('rabbitmq', port_forwards=[5672, 15672])