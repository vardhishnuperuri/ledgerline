package com.example.CRUD;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@TestConfiguration
public class TestRedisConfig {

    @Bean
    public StringRedisTemplate stringRedisTemplate() {
        StringRedisTemplate mock = Mockito.mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> ops = Mockito.mock(ValueOperations.class);
        Mockito.when(mock.opsForValue()).thenReturn(ops);
        Mockito.when(ops.increment(Mockito.anyString())).thenReturn(1L);
        return mock;
    }
}
