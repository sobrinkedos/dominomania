import React from 'react';
import { StatusBar, ScrollView, Linking } from 'react-native';
import styled from 'styled-components/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeProvider';

export default function EmailConfirmation() {
    const router = useRouter();
    const { colors } = useTheme();
    const { email } = useLocalSearchParams<{ email: string }>();
    
    const handleOpenEmail = () => {
        // Tentar abrir o aplicativo de e-mail padrão
        Linking.openURL('mailto:');
    };
    
    const handleBackToLogin = () => {
        router.replace('/login');
    };

    return (
        <Container>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
            <ScrollContent showsVerticalScrollIndicator={false}>
                <FormContainer>
                    <Title>Confirme seu E-mail</Title>
                    
                    <InfoText>
                        Enviamos um e-mail de confirmação para:
                    </InfoText>
                    
                    <EmailText>
                        {email || 'seu endereço de e-mail'}
                    </EmailText>
                    
                    <InfoText>
                        Por favor, verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
                    </InfoText>
                    
                    <Button onPress={handleOpenEmail}>
                        <ButtonText>Abrir App de E-mail</ButtonText>
                    </Button>
                    
                    <InfoText style={{ marginTop: 20 }}>
                        Não recebeu o e-mail? Verifique sua pasta de spam ou solicite um novo e-mail de confirmação.
                    </InfoText>
                    
                    <SecondaryButton onPress={handleBackToLogin}>
                        <SecondaryButtonText>Voltar para Login</SecondaryButtonText>
                    </SecondaryButton>
                </FormContainer>
            </ScrollContent>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView`
    flex: 1;
`;

const FormContainer = styled.View`
    padding: 20px;
    align-items: center;
    justify-content: center;
    margin-top: 40px;
`;

const Title = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 30px;
    text-align: center;
`;

const InfoText = styled.Text`
    font-size: 16px;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 15px;
    text-align: center;
    line-height: 24px;
`;

const EmailText = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 20px;
    text-align: center;
`;

const Button = styled.TouchableOpacity`
    background-color: ${({ theme }) => theme.colors.primary};
    padding: 15px;
    border-radius: 8px;
    width: 100%;
    align-items: center;
    margin-top: 10px;
`;

const ButtonText = styled.Text`
    color: white;
    font-size: 16px;
    font-weight: bold;
`;

const SecondaryButton = styled.TouchableOpacity`
    background-color: transparent;
    padding: 15px;
    border-radius: 8px;
    width: 100%;
    align-items: center;
    margin-top: 10px;
    border: 1px solid ${({ theme }) => theme.colors.primary};
`;

const SecondaryButtonText = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 16px;
    font-weight: bold;
`;
