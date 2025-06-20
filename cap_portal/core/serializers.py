from rest_framework import serializers

class BaseModelSerializer(serializers.ModelSerializer):
    # Turn id field into string as Javascript can't handle the 64-bit IDs that CockroachDB will be giving us
    id = serializers.CharField(read_only=True)

    class Meta:
        abstract = True  # Means that this isn't meant to be used directly, just as a subclass